import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'prisma/prisma.service';

import { resolveCatalogImage } from '@/catalog/catalog-image';
import { normalizeName, uploadRoot } from '@/catalog/catalog.service';
import { Equipment, StretchKind } from '@/generated/prisma/client';
import { CARDIO_MINUTES_MAX, CARDIO_NAME_MAX } from '@/program/program.service';

interface ImportExercise {
  code: string;
  name: string;
  technique?: string;
  image?: string;
  videoUrl?: string;
  equipment?: Equipment;
  primary: string[];
  secondary?: string[];
  joints?: string[];
}

interface ImportStretch {
  code: string;
  name: string;
  howTo?: string;
  image?: string;
  muscles: string[];
  holdSeconds: number;
  perSide?: boolean;
  kind?: StretchKind;
}

interface ImportProgram {
  code: string;
  name: string;
  complexes: {
    name: string;
    cardio?: { name: string; minutes: number };
    exercises: {
      code: string;
      sets: number;
      repsMin: number;
      repsMax: number;
    }[];
  }[];
}

export interface ImportFile {
  exercises: ImportExercise[];
  stretches: ImportStretch[];
  programs: ImportProgram[];
}

export interface ImportReport {
  create: number;
  update: number;
  errors: string[];
}

const EQUIPMENT: Equipment[] = ['BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT'];
const STRETCH_KINDS: StretchKind[] = ['COOLDOWN', 'WARMUP'];
const MAX_ERRORS_SHOWN = 15;

const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const isCount = (value: unknown, max: number): value is number =>
  Number.isInteger(value) && (value as number) >= 1 && (value as number) <= max;
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

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
      programs: list(json.programs) as ImportProgram[],
    };

    const [muscles, joints, dbExercises, dbStretches, dbPrograms] =
      await Promise.all([
        this.prisma.muscle.findMany({ select: { code: true } }),
        this.prisma.joint.findMany({ select: { code: true } }),
        this.prisma.exercise.findMany({
          where: { code: { not: null } },
          select: { code: true },
        }),
        this.prisma.stretch.findMany({
          where: { code: { not: null } },
          select: { code: true },
        }),
        this.prisma.program.findMany({
          where: { code: { not: null } },
          select: { code: true },
        }),
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
    file.exercises.forEach((item, index) => {
      const at = `exercises[${index}]${isText(item?.code) ? ` (${item.code})` : ''}`;
      if (!isText(item?.code)) errors.push(`${at}: нет code`);
      if (!isText(item?.name)) errors.push(`${at}: нет name`);
      if (!list(item?.primary).length)
        errors.push(`${at}: пустые основные мышцы (primary)`);
      for (const code of unknown(item?.primary, muscleCodes))
        errors.push(`${at}: неизвестная мышца ${String(code)}`);
      for (const code of unknown(item?.secondary, muscleCodes))
        errors.push(`${at}: неизвестная мышца ${String(code)}`);
      for (const code of unknown(item?.joints, jointCodes))
        errors.push(`${at}: неизвестный сустав ${String(code)}`);
      if (item?.equipment && !EQUIPMENT.includes(item.equipment))
        errors.push(`${at}: неизвестный инвентарь ${String(item.equipment)}`);
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
    });

    duplicates('programs', file.programs);
    const knownExercises = new Set([
      ...exerciseCodes,
      ...dbExercises.map((e) => e.code as string),
    ]);
    file.programs.forEach((program, index) => {
      const at = `programs[${index}]${isText(program?.code) ? ` (${program.code})` : ''}`;
      if (!isText(program?.code)) errors.push(`${at}: нет code`);
      if (!isText(program?.name)) errors.push(`${at}: нет name`);
      if (!list(program?.complexes).length)
        errors.push(`${at}: нет комплексов`);
      list(program?.complexes).forEach((raw, complexIndex) => {
        const complex = raw as ImportProgram['complexes'][number];
        const where = `${at}, комплекс ${complexIndex + 1}`;
        if (!isText(complex?.name)) errors.push(`${where}: нет name`);
        if (!list(complex?.exercises).length)
          errors.push(`${where}: нет упражнений`);
        if (
          complex?.cardio !== undefined &&
          (!isText(complex.cardio?.name) ||
            complex.cardio.name.trim().length > CARDIO_NAME_MAX ||
            !isCount(complex.cardio?.minutes, CARDIO_MINUTES_MAX))
        )
          errors.push(`${where}: проверь cardio — нужны name и minutes`);
        for (const item of list(
          complex?.exercises,
        ) as ImportProgram['complexes'][number]['exercises']) {
          if (!knownExercises.has(item?.code))
            errors.push(
              `${where}: неизвестное упражнение ${String(item?.code)}`,
            );
          if (
            !isCount(item?.sets, 20) ||
            !isCount(item?.repsMin, 200) ||
            !isCount(item?.repsMax, 200) ||
            item.repsMin > item.repsMax
          )
            errors.push(
              `${where}, ${String(item?.code)}: проверь sets / repsMin / repsMax`,
            );
        }
      });
    });

    const existing = new Set([
      ...dbExercises.map((e) => `e:${e.code}`),
      ...dbStretches.map((s) => `s:${s.code}`),
      ...dbPrograms.map((p) => `p:${p.code}`),
    ]);
    const keys = [
      ...file.exercises.map((e) => `e:${e?.code}`),
      ...file.stretches.map((s) => `s:${s?.code}`),
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
          select: { code: true, imagePath: true },
        })
      ).map((e) => [`e:${e.code}`, e.imagePath] as [string, string | null]),
      ...(
        await this.prisma.stretch.findMany({
          where: { code: { not: null } },
          select: { code: true, imagePath: true },
        })
      ).map((s) => [`s:${s.code}`, s.imagePath] as [string, string | null]),
    ]);
    const withImages = [
      ...file.exercises.map((e) => ({ key: `e:${e.code}`, image: e.image })),
      ...file.stretches.map((s) => ({ key: `s:${s.code}`, image: s.image })),
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
          const imagePath = images.get(`e:${item.code}`);
          const data = {
            name: item.name.trim(),
            nameNormalized: normalizeName(item.name),
            technique: item.technique ?? null,
            videoUrl: item.videoUrl ?? null,
            equipment: item.equipment ?? null,
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
          const data = {
            name: item.name.trim(),
            nameNormalized: normalizeName(item.name),
            howTo: item.howTo ?? null,
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

        const exerciseId = new Map(
          (
            await tx.exercise.findMany({
              where: { code: { not: null } },
              select: { id: true, code: true },
            })
          ).map((e) => [e.code as string, e.id]),
        );
        for (const item of file.programs) {
          const program = await tx.program.upsert({
            where: { code: item.code },
            create: {
              code: item.code,
              name: item.name.trim(),
              isTemplate: true,
            },
            update: {
              name: item.name.trim(),
              isTemplate: true,
              contentUpdatedAt: new Date(),
            },
          });
          await tx.complex.deleteMany({ where: { programId: program.id } });
          for (const [index, complex] of item.complexes.entries())
            await tx.complex.create({
              data: {
                programId: program.id,
                name: complex.name.trim(),
                position: index + 1,
                cardioName: complex.cardio?.name.trim() ?? null,
                cardioMinutes: complex.cardio?.minutes ?? null,
                exercises: {
                  create: complex.exercises.map((exercise, position) => ({
                    exerciseId: exerciseId.get(exercise.code)!,
                    position: position + 1,
                    sets: exercise.sets,
                    repsMin: exercise.repsMin,
                    repsMax: exercise.repsMax,
                  })),
                },
              },
            });
        }
      },
      { timeout: 120_000, maxWait: 10_000 },
    );
    this.logger.log(
      `Импорт применён: упражнений=${file.exercises.length}, растяжек=${file.stretches.length}, шаблонов=${file.programs.length}`,
    );
    return report;
  }

  private pendingPath(adminId: number): string {
    return path.join(uploadRoot(), 'tmp', `import-${adminId}.json`);
  }
}
