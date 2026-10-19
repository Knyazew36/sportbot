import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'prisma/prisma.service';

import { resolveCatalogImage } from '@/catalog/catalog-image';
import { MEASURE_LIMITS } from '@/catalog/measure';
import { normalizeName, uploadRoot } from '@/catalog/catalog.service';
import {
  Equipment,
  ExerciseMeasure,
  StretchKind,
} from '@/generated/prisma/client';
import { normalizeSupersets, supersetError } from '@/program/superset';
import { WARMUP_MINUTES } from '@/program/warmup';
import {
  TAG_CODE_PATTERN,
  TAG_NAME_MAX,
} from '@/program-tag/dto/create-program-tag.dto';
import {
  GROUP_NAME_MAX,
  GROUP_RESERVED_CODE,
} from '@/program-tag/dto/create-program-tag-group.dto';

/**
 * Упражнение справочника. Без primary — частичная запись существующего упражнения:
 * меняются только переданные поля (measure, equipment, videoUrl, technique, steps, mistakes),
 * название, мышцы и картинки не трогаются. Так меняют меру, не затирая правки на проде.
 */
interface ImportExercise {
  code: string;
  name?: string;
  technique?: string;
  /** Шаги и ошибки; поля нет — у существующей записи списки не меняются. */
  steps?: string[];
  mistakes?: string[];
  /** Фото финишного положения: ссылка или путь, как у image. */
  imageEnd?: string;
  image?: string;
  videoUrl?: string;
  equipment?: Equipment;
  /** Чем меряется: повторы или время. Поля нет — у новой записи REPS, у существующей не меняется. */
  measure?: ExerciseMeasure;
  primary?: string[];
  secondary?: string[];
  joints?: string[];
}

interface ImportStretch {
  code: string;
  name: string;
  howTo?: string;
  /** Шаги и ошибки; поля нет — у существующей записи списки не меняются. */
  steps?: string[];
  mistakes?: string[];
  /** Фото финишного положения: ссылка или путь, как у image. */
  imageEnd?: string;
  image?: string;
  muscles: string[];
  holdSeconds: number;
  perSide?: boolean;
  kind?: StretchKind;
}

interface ImportProgramTagGroup {
  code: string;
  name: string;
  /** Порядок рядов чипов; без него группа встаёт в конец в порядке файла. */
  position?: number;
}

interface ImportProgramTag {
  code: string;
  name: string;
  /** Код группы. Поля нет — у нового тега «Прочее», у существующего группа не меняется. */
  group?: string;
  /** Порядок чипа в группе; без него тег встаёт в конец группы в порядке файла. */
  position?: number;
}

interface ImportProgram {
  code: string;
  /** Без complexes — частичная запись существующего шаблона: name можно не указывать. */
  name?: string;
  /** Кому подходит и что нужно из инвентаря. Поля нет — описание не трогаем. */
  description?: string;
  /** Коды тегов витрины. Поля нет — теги шаблона не трогаем; пустой массив снимает все. */
  tags?: string[];
  /** Виден в каталоге. Поля нет — новый шаблон публикуется, у существующего не меняется. */
  published?: boolean;
  /**
   * Состав шаблона целиком: заменяет комплексы. Поля нет — частичная запись: меняются только
   * переданные поля (published, tags, description, name), состав не трогается. Так шаблон
   * снимают с витрины, не затирая правки состава на проде.
   */
  complexes?: {
    name: string;
    /** Разминка, мин: 0, 5, 10 или 15. Поля нет — как в профиле пользователя. */
    warmupMinutes?: number;
    exercises: {
      code: string;
      sets: number;
      repsMin: number;
      repsMax: number;
      /** Номер суперсета в комплексе: участники подряд, не меньше двух. Поля нет — одиночное. */
      superset?: number;
    }[];
  }[];
}

export interface ImportFile {
  exercises: ImportExercise[];
  stretches: ImportStretch[];
  programTagGroups: ImportProgramTagGroup[];
  programTags: ImportProgramTag[];
  programs: ImportProgram[];
}

export interface ImportReport {
  create: number;
  update: number;
  errors: string[];
}

const EQUIPMENT: Equipment[] = ['BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT'];
const MEASURES: ExerciseMeasure[] = ['REPS', 'TIME', 'MINUTES'];
const STRETCH_KINDS: StretchKind[] = ['COOLDOWN', 'WARMUP'];
const MAX_ERRORS_SHOWN = 15;
/** Куда попадает новый тег без группы в файле. */
const FALLBACK_GROUP = { code: 'other', name: 'Прочее' };

const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const isCount = (value: unknown, max: number): value is number =>
  Number.isInteger(value) && (value as number) >= 1 && (value as number) <= max;
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const isTextList = (value: unknown): boolean =>
  value === undefined ||
  (Array.isArray(value) &&
    value.length <= 20 &&
    value.every((item) => isText(item) && item.length <= 300));

/** Шаги и ошибки из файла — только если поле есть: иначе импорт не затирает правки. */
const guideData = (item: { steps?: string[]; mistakes?: string[] }) => ({
  ...(item.steps && { steps: item.steps.map((s) => s.trim()) }),
  ...(item.mistakes && { mistakes: item.mistakes.map((m) => m.trim()) }),
});

/**
 * Импорт справочника и шаблонов JSON-файлом (раздел 30.2 ТЗ). Запись ищется по `code`:
 * есть — обновляется, нет — создаётся. Удаления импортом нет.
 */
@Injectable()
export class ImportService {
  private readonly logger = new Logger(`📥 ${ImportService.name}`);

  constructor(private readonly prisma: PrismaService) {}

  // ── Проверка ────────────────────────────────────────────────────────────

  /** Разобрать и проверить весь файл. Запись в БД — только после apply. */
  public async check(
    raw: string,
  ): Promise<{ file: ImportFile; report: ImportReport }> {
    let json: Record<string, unknown>;
    try {
      // Редакторы Windows добавляют BOM в начало файла — JSON.parse на нём падает
      json = JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
    } catch (error) {
      throw new BadRequestException(
        `Файл — не JSON: ${(error as Error).message}`,
      );
    }
    if (!json || typeof json !== 'object' || Array.isArray(json))
      throw new BadRequestException(
        'В корне файла должен быть объект с полями exercises, stretches, programs.',
      );
    const file: ImportFile = {
      exercises: list(json.exercises) as ImportExercise[],
      stretches: list(json.stretches) as ImportStretch[],
      programTagGroups: list(json.programTagGroups) as ImportProgramTagGroup[],
      programTags: list(json.programTags) as ImportProgramTag[],
      programs: list(json.programs) as ImportProgram[],
    };

    const [
      muscles,
      joints,
      dbExercises,
      dbStretches,
      dbPrograms,
      dbTags,
      dbGroups,
    ] = await Promise.all([
      this.prisma.muscle.findMany({ select: { code: true } }),
      this.prisma.joint.findMany({ select: { code: true } }),
      this.prisma.exercise.findMany({
        where: { code: { not: null } },
        select: { code: true, measure: true },
      }),
      this.prisma.stretch.findMany({
        where: { code: { not: null } },
        select: { code: true },
      }),
      this.prisma.program.findMany({
        where: { code: { not: null } },
        select: { code: true },
      }),
      this.prisma.programTag.findMany({ select: { code: true } }),
      this.prisma.programTagGroup.findMany({ select: { code: true } }),
    ]);
    const muscleCodes = new Set(muscles.map((m) => m.code));
    const jointCodes = new Set(joints.map((j) => j.code));
    const errors: string[] = [];
    const unknown = (codes: unknown, known: Set<string>) =>
      list(codes).filter((code) => !known.has(String(code)));
    const duplicates = (section: string, items: { code: string }[]) => {
      const seen = new Set<string>();
      for (const item of items) {
        if (!isText(item?.code)) continue;
        if (seen.has(item.code))
          errors.push(`${section}: код ${item.code} повторяется`);
        seen.add(item.code);
      }
      return seen;
    };

    const exerciseCodes = duplicates('exercises', file.exercises);
    const dbExerciseCodes = new Set(dbExercises.map((e) => e.code as string));
    file.exercises.forEach((item, index) => {
      const at = `exercises[${index}]${isText(item?.code) ? ` (${item.code})` : ''}`;
      const partial = item?.primary === undefined;
      if (!isText(item?.code)) errors.push(`${at}: нет code`);
      if (partial && isText(item?.code) && !dbExerciseCodes.has(item.code))
        errors.push(`${at}: без primary можно только поправить уже существующее упражнение`);
      if (!partial && !isText(item?.name)) errors.push(`${at}: нет name`);
      if (!partial && !list(item?.primary).length)
        errors.push(`${at}: пустые основные мышцы (primary)`);
      for (const code of unknown(item?.primary, muscleCodes))
        errors.push(`${at}: неизвестная мышца ${String(code)}`);
      for (const code of unknown(item?.secondary, muscleCodes))
        errors.push(`${at}: неизвестная мышца ${String(code)}`);
      for (const code of unknown(item?.joints, jointCodes))
        errors.push(`${at}: неизвестный сустав ${String(code)}`);
      if (item?.measure !== undefined && !MEASURES.includes(item.measure))
        errors.push(`${at}: measure — REPS, TIME или MINUTES`);
      if (item?.equipment && !EQUIPMENT.includes(item.equipment))
        errors.push(`${at}: неизвестный инвентарь ${String(item.equipment)}`);
      if (!isTextList(item?.steps) || !isTextList(item?.mistakes))
        errors.push(`${at}: steps/mistakes — до 20 непустых строк по 300 символов`);
    });

    duplicates('stretches', file.stretches);
    file.stretches.forEach((item, index) => {
      const at = `stretches[${index}]${isText(item?.code) ? ` (${item.code})` : ''}`;
      if (!isText(item?.code)) errors.push(`${at}: нет code`);
      if (!isText(item?.name)) errors.push(`${at}: нет name`);
      if (!list(item?.muscles).length)
        errors.push(`${at}: пустые мышцы (muscles)`);
      for (const code of unknown(item?.muscles, muscleCodes))
        errors.push(`${at}: неизвестная мышца ${String(code)}`);
      if (!isCount(item?.holdSeconds, 600))
        errors.push(`${at}: holdSeconds — целое от 1 до 600`);
      if (item?.kind && !STRETCH_KINDS.includes(item.kind))
        errors.push(`${at}: неизвестный kind ${String(item.kind)}`);
      if (!isTextList(item?.steps) || !isTextList(item?.mistakes))
        errors.push(`${at}: steps/mistakes — до 20 непустых строк по 300 символов`);
    });

    const groupCodes = duplicates('programTagGroups', file.programTagGroups);
    file.programTagGroups.forEach((item, index) => {
      const at = `programTagGroups[${index}]${isText(item?.code) ? ` (${item.code})` : ''}`;
      if (
        !isText(item?.code) ||
        !TAG_CODE_PATTERN.test(item.code) ||
        item.code === GROUP_RESERVED_CODE
      )
        errors.push(
          `${at}: code — латиница в нижнем регистре, цифры и дефис, не «${GROUP_RESERVED_CODE}»`,
        );
      if (!isText(item?.name) || item.name.trim().length > GROUP_NAME_MAX)
        errors.push(`${at}: name — от 1 до ${GROUP_NAME_MAX} символов`);
      if (item?.position !== undefined && !isCount(item.position, 1000))
        errors.push(`${at}: position — целое от 1 до 1000`);
    });
    const knownGroups = new Set([
      ...groupCodes,
      ...dbGroups.map((g) => g.code),
    ]);

    const tagCodes = duplicates('programTags', file.programTags);
    file.programTags.forEach((item, index) => {
      const at = `programTags[${index}]${isText(item?.code) ? ` (${item.code})` : ''}`;
      if (!isText(item?.code) || !TAG_CODE_PATTERN.test(item.code))
        errors.push(`${at}: code — латиница в нижнем регистре, цифры и дефис`);
      if (!isText(item?.name) || item.name.trim().length > TAG_NAME_MAX)
        errors.push(`${at}: name — от 1 до ${TAG_NAME_MAX} символов`);
      if (item?.position !== undefined && !isCount(item.position, 1000))
        errors.push(`${at}: position — целое от 1 до 1000`);
      if (item?.group !== undefined && !knownGroups.has(String(item.group)))
        errors.push(`${at}: неизвестная группа ${String(item.group)}`);
    });

    duplicates('programs', file.programs);
    const knownExercises = new Set([
      ...exerciseCodes,
      ...dbExercises.map((e) => e.code as string),
    ]);
    const knownTags = new Set([...tagCodes, ...dbTags.map((t) => t.code)]);
    // Мера из файла важнее базы: патч может перевести упражнение на время
    const measureOf = new Map<string, ExerciseMeasure>([
      ...dbExercises.map((e) => [e.code as string, e.measure] as const),
      ...file.exercises
        .filter((e) => e?.measure)
        .map((e) => [e.code, e.measure!] as const),
    ]);
    const knownPrograms = new Set(dbPrograms.map((p) => p.code as string));
    file.programs.forEach((program, index) => {
      const at = `programs[${index}]${isText(program?.code) ? ` (${program.code})` : ''}`;
      const partial = program?.complexes === undefined;
      if (!isText(program?.code)) errors.push(`${at}: нет code`);
      if (partial && isText(program?.code) && !knownPrograms.has(program.code))
        errors.push(`${at}: без complexes можно только поправить уже существующий шаблон`);
      if (!partial && !isText(program?.name)) errors.push(`${at}: нет name`);
      if (partial && program?.name !== undefined && !isText(program.name))
        errors.push(`${at}: name — непустая строка`);
      if (
        program?.description !== undefined &&
        (typeof program.description !== 'string' ||
          program.description.length > 1000)
      )
        errors.push(`${at}: description — строка до 1000 символов`);
      if (
        program?.published !== undefined &&
        typeof program.published !== 'boolean'
      )
        errors.push(`${at}: published — true или false`);
      if (program?.tags !== undefined && !Array.isArray(program.tags))
        errors.push(`${at}: tags — массив кодов тегов`);
      for (const code of unknown(program?.tags, knownTags))
        errors.push(`${at}: неизвестный тег ${String(code)}`);
      if (!partial && !list(program?.complexes).length)
        errors.push(`${at}: нет тренировок`);
      list(program?.complexes).forEach((raw, complexIndex) => {
        const complex = raw as NonNullable<ImportProgram['complexes']>[number];
        const where = `${at}, тренировка ${complexIndex + 1}`;
        if (!isText(complex?.name)) errors.push(`${where}: нет name`);
        if (!list(complex?.exercises).length)
          errors.push(`${where}: нет упражнений`);
        if (
          complex?.warmupMinutes !== undefined &&
          !(WARMUP_MINUTES as readonly unknown[]).includes(complex.warmupMinutes)
        )
          errors.push(`${where}: warmupMinutes — 0, 5, 10 или 15`);
        const legacy = complex as { cardio?: unknown; legacyCardio?: unknown };
        if (legacy?.cardio !== undefined || legacy?.legacyCardio !== undefined)
          errors.push(
            `${where}: блока cardio больше нет — добавь кардио упражнением на время (measure TIME)`,
          );
        for (const item of list(
          complex?.exercises,
        ) as NonNullable<ImportProgram['complexes']>[number]['exercises']) {
          if (!knownExercises.has(item?.code))
            errors.push(
              `${where}: неизвестное упражнение ${String(item?.code)}`,
            );
          // Секунды у упражнения на время, повторы у остальных
          const maxReps =
            MEASURE_LIMITS[measureOf.get(item?.code) ?? 'REPS'].plan;
          if (
            !isCount(item?.sets, 20) ||
            !isCount(item?.repsMin, maxReps) ||
            !isCount(item?.repsMax, maxReps) ||
            item.repsMin > item.repsMax
          )
            errors.push(
              `${where}, ${String(item?.code)}: проверь sets / repsMin / repsMax`,
            );
          if (item?.superset !== undefined && !isCount(item.superset, 30))
            errors.push(
              `${where}, ${String(item?.code)}: superset — номер от 1 до 30`,
            );
        }
        const superset = supersetError(
          list(complex?.exercises) as NonNullable<ImportProgram['complexes']>[number]['exercises'],
        );
        if (superset) errors.push(`${where}: ${superset}`);
      });
    });

    const existing = new Set([
      ...dbExercises.map((e) => `e:${e.code}`),
      ...dbStretches.map((s) => `s:${s.code}`),
      ...dbPrograms.map((p) => `p:${p.code}`),
      ...dbTags.map((t) => `t:${t.code}`),
      ...dbGroups.map((g) => `g:${g.code}`),
    ]);
    const keys = [
      ...file.exercises.map((e) => `e:${e?.code}`),
      ...file.stretches.map((s) => `s:${s?.code}`),
      ...file.programTagGroups.map((g) => `g:${g?.code}`),
      ...file.programTags.map((t) => `t:${t?.code}`),
      ...file.programs.map((p) => `p:${p?.code}`),
    ];
    const update = keys.filter((key) => existing.has(key)).length;
    return { file, report: { create: keys.length - update, update, errors } };
  }

  public reportText(report: ImportReport): string {
    const lines = [
      `Создам: ${report.create}, обновлю: ${report.update}, ошибок: ${report.errors.length}`,
    ];
    if (report.errors.length) {
      lines.push(
        '',
        ...report.errors.slice(0, MAX_ERRORS_SHOWN).map((e) => `• ${e}`),
      );
      if (report.errors.length > MAX_ERRORS_SHOWN)
        lines.push(`… и ещё ${report.errors.length - MAX_ERRORS_SHOWN}`);
    }
    return lines.join('\n');
  }

  // ── Отложенный файл ─────────────────────────────────────────────────────

  /** Проверенный файл ждёт кнопки «Применить» на диске: перезапуск сервера его не теряет. */
  public savePending(adminId: number, raw: string): void {
    fs.mkdirSync(path.dirname(this.pendingPath(adminId)), { recursive: true });
    fs.writeFileSync(this.pendingPath(adminId), raw, 'utf-8');
  }

  public loadPending(adminId: number): string | null {
    const file = this.pendingPath(adminId);
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : null;
  }

  public dropPending(adminId: number): void {
    fs.rmSync(this.pendingPath(adminId), { force: true });
  }

  // ── Запись ──────────────────────────────────────────────────────────────

  /** Применить файл одной транзакцией. Файл с ошибками не применяется. */
  public async apply(raw: string): Promise<ImportReport> {
    const { file, report } = await this.check(raw);
    if (report.errors.length)
      throw new BadRequestException(
        'В файле есть ошибки — исправь и пришли заново.',
      );

    // Картинки качаем до транзакции: сеть внутри неё держала бы соединение с БД
    const images = new Map<string, string>();
    const current = new Map<string, string | null>([
      ...(
        await this.prisma.exercise.findMany({
          where: { code: { not: null } },
          select: { code: true, imagePath: true, imageEndPath: true },
        })
      ).flatMap((e) => [
        [`e:${e.code}`, e.imagePath] as [string, string | null],
        [`e:${e.code}:end`, e.imageEndPath] as [string, string | null],
      ]),
      ...(
        await this.prisma.stretch.findMany({
          where: { code: { not: null } },
          select: { code: true, imagePath: true, imageEndPath: true },
        })
      ).flatMap((s) => [
        [`s:${s.code}`, s.imagePath] as [string, string | null],
        [`s:${s.code}:end`, s.imageEndPath] as [string, string | null],
      ]),
    ]);
    const withImages = [
      ...file.exercises.flatMap((e) => [
        { key: `e:${e.code}`, image: e.image },
        { key: `e:${e.code}:end`, image: e.imageEnd },
      ]),
      ...file.stretches.flatMap((s) => [
        { key: `s:${s.code}`, image: s.image },
        { key: `s:${s.code}:end`, image: s.imageEnd },
      ]),
    ];
    for (const item of withImages) {
      if (!isText(item.image)) continue;
      // Уже скачанную по ссылке картинку повторный импорт не качает заново
      if (/^https?:\/\//i.test(item.image) && current.get(item.key)) continue;
      images.set(item.key, await resolveCatalogImage(item.image));
    }

    await this.prisma.$transaction(
      async (tx) => {
        const muscleId = new Map(
          (await tx.muscle.findMany()).map((m) => [m.code, m.id]),
        );
        const jointId = new Map(
          (await tx.joint.findMany()).map((j) => [j.code, j.id]),
        );

        for (const item of file.exercises) {
          if (item.primary === undefined) {
            await tx.exercise.update({
              where: { code: item.code },
              data: {
                ...(item.measure && { measure: item.measure }),
                ...(item.equipment !== undefined && {
                  equipment: item.equipment,
                }),
                ...(item.videoUrl !== undefined && { videoUrl: item.videoUrl }),
                ...(item.technique !== undefined && {
                  technique: item.technique,
                }),
                ...guideData(item),
              },
            });
            continue;
          }
          // Полная запись: name и primary проверены в check
          const name = item.name!;
          const imagePath = images.get(`e:${item.code}`);
          const imageEndPath = images.get(`e:${item.code}:end`);
          const data = {
            name: name.trim(),
            nameNormalized: normalizeName(name),
            technique: item.technique ?? null,
            ...guideData(item),
            ...(imageEndPath && { imageEndPath }),
            videoUrl: item.videoUrl ?? null,
            equipment: item.equipment ?? null,
            ...(item.measure && { measure: item.measure }),
            status: 'CATALOG' as const,
            ...(imagePath
              ? { imagePath, imageTelegramFileId: null, imageMaxToken: null }
              : {}),
          };
          const primary = [...new Set(item.primary)];
          const secondary = [...new Set(item.secondary ?? [])].filter(
            (code) => !primary.includes(code),
          );
          const relations = {
            muscles: {
              create: [
                ...primary.map((code) => ({
                  muscleId: muscleId.get(code)!,
                  role: 'PRIMARY' as const,
                })),
                ...secondary.map((code) => ({
                  muscleId: muscleId.get(code)!,
                  role: 'SECONDARY' as const,
                })),
              ],
            },
            joints: {
              create: [...new Set(item.joints ?? [])].map((code) => ({
                jointId: jointId.get(code)!,
              })),
            },
          };
          await tx.exercise.upsert({
            where: { code: item.code },
            create: { code: item.code, ...data, ...relations },
            update: {
              ...data,
              muscles: { deleteMany: {}, create: relations.muscles.create },
              joints: { deleteMany: {}, create: relations.joints.create },
            },
          });
        }

        for (const item of file.stretches) {
          const imagePath = images.get(`s:${item.code}`);
          const imageEndPath = images.get(`s:${item.code}:end`);
          const data = {
            name: item.name.trim(),
            nameNormalized: normalizeName(item.name),
            howTo: item.howTo ?? null,
            ...guideData(item),
            ...(imageEndPath && { imageEndPath }),
            holdSeconds: item.holdSeconds,
            perSide: item.perSide ?? false,
            kind: item.kind ?? ('COOLDOWN' as const),
            status: 'CATALOG' as const,
            ...(imagePath
              ? { imagePath, imageTelegramFileId: null, imageMaxToken: null }
              : {}),
          };
          const muscles = [...new Set(item.muscles)].map((code) => ({
            muscleId: muscleId.get(code)!,
          }));
          await tx.stretch.upsert({
            where: { code: item.code },
            create: { code: item.code, ...data, muscles: { create: muscles } },
            update: { ...data, muscles: { deleteMany: {}, create: muscles } },
          });
        }

        // Группы — до тегов, теги — до программ: ссылки идут по коду
        const lastGroup = await tx.programTagGroup.aggregate({
          _max: { position: true },
        });
        let nextGroupPosition = lastGroup._max.position ?? 0;
        for (const item of file.programTagGroups) {
          const name = item.name.trim();
          await tx.programTagGroup.upsert({
            where: { code: item.code },
            create: {
              code: item.code,
              name,
              position: item.position ?? ++nextGroupPosition,
            },
            update: {
              name,
              ...(item.position !== undefined
                ? { position: item.position }
                : {}),
            },
          });
        }
        const groupId = new Map(
          (
            await tx.programTagGroup.findMany({
              select: { id: true, code: true },
            })
          ).map((g) => [g.code, g.id]),
        );
        // Тег без группы в файле: новый уходит в «Прочее», как плоские теги при переходе на группы
        const fallbackGroupId = async (): Promise<number> => {
          const known = groupId.get(FALLBACK_GROUP.code);
          if (known) return known;
          const last = await tx.programTagGroup.aggregate({
            _max: { position: true },
          });
          const created = await tx.programTagGroup.create({
            data: {
              ...FALLBACK_GROUP,
              position: (last._max.position ?? 0) + 1,
            },
          });
          groupId.set(created.code, created.id);
          return created.id;
        };
        /** Следующее место чипа в группе: у каждой группы свой счётчик. */
        const tagPositions = new Map<number, number>();
        const nextTagPosition = async (id: number): Promise<number> => {
          if (!tagPositions.has(id)) {
            const last = await tx.programTag.aggregate({
              where: { groupId: id },
              _max: { position: true },
            });
            tagPositions.set(id, last._max.position ?? 0);
          }
          const next = tagPositions.get(id)! + 1;
          tagPositions.set(id, next);
          return next;
        };
        for (const item of file.programTags) {
          const name = item.name.trim();
          const group = item.group
            ? groupId.get(item.group)!
            : await fallbackGroupId();
          await tx.programTag.upsert({
            where: { code: item.code },
            create: {
              code: item.code,
              name,
              groupId: group,
              position: item.position ?? (await nextTagPosition(group)),
            },
            update: {
              name,
              ...(item.group ? { groupId: group } : {}),
              ...(item.position !== undefined
                ? { position: item.position }
                : {}),
            },
          });
        }

        const lastTemplate = await tx.program.aggregate({
          where: { isTemplate: true },
          _max: { position: true },
        });
        let nextTemplatePosition = lastTemplate._max.position ?? 0;
        const exerciseId = new Map(
          (
            await tx.exercise.findMany({
              where: { code: { not: null } },
              select: { id: true, code: true },
            })
          ).map((e) => [e.code as string, e.id]),
        );
        for (const item of file.programs) {
          const tags = item.tags?.map((code) => ({ code }));
          const description =
            item.description !== undefined
              ? { description: item.description.trim() || null }
              : {};
          if (!item.complexes) {
            await tx.program.update({
              where: { code: item.code },
              data: {
                ...(item.name ? { name: item.name.trim() } : {}),
                ...(item.published !== undefined
                  ? { isPublished: item.published }
                  : {}),
                ...description,
                ...(tags ? { tags: { set: tags } } : {}),
              },
            });
            continue;
          }
          const name = item.name!.trim();
          const program = await tx.program.upsert({
            where: { code: item.code },
            create: {
              code: item.code,
              name,
              isTemplate: true,
              // Файл готовит админ — шаблон из него сразу в каталоге, если не сказано иначе
              isPublished: item.published ?? true,
              position: ++nextTemplatePosition,
              ...description,
              ...(tags ? { tags: { connect: tags } } : {}),
            },
            update: {
              name,
              isTemplate: true,
              contentUpdatedAt: new Date(),
              ...(item.published !== undefined
                ? { isPublished: item.published }
                : {}),
              ...description,
              ...(tags ? { tags: { set: tags } } : {}),
            },
          });
          await tx.complex.deleteMany({ where: { programId: program.id } });
          for (const [index, complex] of item.complexes.entries()) {
            // Номера из файла приводим к 1..n сверху вниз, как в редакторе
            const supersets = normalizeSupersets(
              complex.exercises.map((exercise, id) => ({
                id,
                superset: exercise.superset ?? null,
              })),
            );
            await tx.complex.create({
              data: {
                programId: program.id,
                name: complex.name.trim(),
                position: index + 1,
                warmupMinutes: complex.warmupMinutes ?? null,
                exercises: {
                  create: complex.exercises.map((exercise, position) => ({
                    exerciseId: exerciseId.get(exercise.code)!,
                    position: position + 1,
                    sets: exercise.sets,
                    repsMin: exercise.repsMin,
                    repsMax: exercise.repsMax,
                    superset: supersets[position].superset,
                  })),
                },
              },
            });
          }
        }
      },
      { timeout: 120_000, maxWait: 10_000 },
    );
    this.logger.log(
      `Импорт применён: упражнений=${file.exercises.length}, растяжек=${file.stretches.length}, групп тегов=${file.programTagGroups.length}, тегов=${file.programTags.length}, шаблонов=${file.programs.length}`,
    );
    return report;
  }

  private pendingPath(adminId: number): string {
    return path.join(uploadRoot(), 'tmp', `import-${adminId}.json`);
  }
}
