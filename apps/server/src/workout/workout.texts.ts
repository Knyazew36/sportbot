import {
  BACK_TO_MENU,
  btn,
  cut,
  fmtDay,
  grid,
  hint,
  linkBtn,
  msg,
  numEmoji,
  plural,
} from '@/bot';
import { holdText } from '@/catalog/catalog.texts';
import { durationText, isTimed } from '@/catalog/measure';
import type { ExerciseMeasure } from '@/generated/prisma/client';
import { MessengerButton, MessengerMessage } from '@/messengers';
import { ComplexFull } from '@/program/program.service';
import { cardioText, exercisesCount, planText } from '@/program/program.texts';
import { supersetMark } from '@/program/superset';

import { CooldownView } from './cooldown.service';
import { roundInfo } from './superset-round';
import {
  CompleteResult,
  isDone,
  LastResult,
  WorkoutExerciseFull,
  WorkoutFull,
  WorkoutTotals,
} from './workout.service';

type WithJoints = { joints: { jointId: number; joint: { name: string } }[] };

/** Зоны с ограничением, которые нагружает упражнение: «плечо, локоть» или пусто. */
export function limitedZones(
  exercise: WithJoints,
  limited: Set<number>,
): string {
  return exercise.joints
    .filter((j) => limited.has(j.jointId))
    .map((j) => j.joint.name.toLowerCase())
    .join(', ');
}

const warn = (exercise: WithJoints, limited: Set<number>): string => {
  const zones = limitedZones(exercise, limited);
  return zones ? ` ⚠️ ${zones}` : '';
};

const num = (value: number): string => String(Number(value.toFixed(2)));

/** Один подход: «22 кг × 10 повт.»; без веса — «без веса × 12 повт.»; на время — «45 с». */
const setText =
  (measure: ExerciseMeasure) =>
  (set: { weight: number; reps: number }): string =>
    isTimed(measure)
      ? durationText(set.reps)
      : `${set.weight === 0 ? 'без веса' : `${num(set.weight)} кг`} × ${set.reps} повт.`;

/**
 * Как записать подход. Пример — отдельной строкой, чтобы формат читался с одного взгляда,
 * а вариант без веса — ниже, чтобы не путать с основным.
 */
export const SET_INPUT_EXAMPLE =
  'например:\n60 10\nБез веса — только повторы: 10';

/** Подход на время: у удержания — секунды или мм:сс, у кардио — минуты. */
export const timeInputExample = (measure: ExerciseMeasure) =>
  measure === 'MINUTES'
    ? 'например:\n20 — это 20 минут\n20:30 — двадцать с половиной'
    : 'например:\n45 — это 45 секунд\n1:30 — полторы минуты';

// ── Комплекс ────────────────────────────────────────────────────────────

/** Комплекс до старта тренировки. */
export function previewMessage(
  complex: ComplexFull,
  limited: Set<number>,
): MessengerMessage {
  const cardio = cardioText(complex);
  return msg(
    [
      `«${complex.name}» — ${exercisesCount(complex.exercises.length)}`,
      ...complex.exercises.map(
        (item, index) =>
          `${index + 1}. ${supersetMark(item.superset)}${item.exercise.name}${warn(item.exercise, limited)} — ${planText(item.sets, item.repsMin, item.repsMax, item.exercise.measure)}`,
      ),
      ...(cardio ? [cardio] : []),
    ].join('\n'),
    [
      [btn('▶️ Начать', `wo:start:${complex.id}`)],
      [btn('🔀 Другая тренировка', 'wo:pick')],
    ],
  );
}

/** Шаг тренировки. */
export function stepMessage(
  workout: WorkoutFull,
  item: WorkoutExerciseFull,
  last: LastResult | null,
  limited: Set<number>,
): MessengerMessage {
  const index = workout.exercises.findIndex((e) => e.id === item.id);
  const timed = isTimed(item.exercise.measure);
  const zones = limitedZones(item.exercise, limited);
  const sets = item.sets.map((s) => ({
    weight: Number(s.weight),
    reps: s.reps,
  }));
  const lines = [
    `${index + 1} из ${workout.exercises.length}. ${item.exercise.name} — ${planText(item.plannedSets, item.repsMin, item.repsMax, item.exercise.measure)}${isDone(item) && item.done ? ' ✅' : ''}`,
  ];
  const round = roundInfo(workout.exercises, item.id);
  if (round) {
    const next = workout.exercises.find((e) => e.id === round.nextId);
    lines.push(
      `🔗 Суперсет ${round.letter} · круг ${round.round} из ${round.rounds}${next ? ` · дальше: ${next.exercise.name}` : ''}`,
    );
  }
  if (zones) lines.push(`⚠️ Нагружает: ${zones} — заменить?`);
  // Прошлого результата нет — строку не показываем вовсе
  // Прошлый раз и сегодня — два одинаковых блока: подход на строку, сравнивать глазами
  if (last)
    lines.push(
      '',
      `🕓 Прошлый раз (${fmtDay(last.date)}):`,
      ...last.sets.map(setText(item.exercise.measure)),
    );
  // Смайл выделяет блок: по нему видно, что только что введённый подход записан
  if (sets.length)
    lines.push('', '🔥 Сегодня:', ...sets.map(setText(item.exercise.measure)));
  // Какой подход сейчас — чтобы не сбиться со счёта между подходами
  lines.push(
    '',
    sets.length < item.plannedSets
      ? `Сейчас подход ${numEmoji(sets.length + 1)} из ${numEmoji(item.plannedSets)}.\n${hint(timed ? `❗ Введи время, ${timeInputExample(item.exercise.measure)}` : `❗ Введи вес и повторы, ${SET_INPUT_EXAMPLE}`)}`
      : `Все подходы записаны: ${sets.length} из ${item.plannedSets}.\n${hint(`Жми «Следующее упражнение». Или запиши ещё подход (${sets.length + 1}-й), ${timed ? timeInputExample(item.exercise.measure) : SET_INPUT_EXAMPLE}`)}`,
  );

  const rows: MessengerButton[][] = [
    [
      btn('ℹ️ Техника', `ex:v:${item.exerciseId}:w`),
      btn('🔁 Заменить', `sw:list:${item.id}`),
    ],
  ];
  if (sets.length)
    rows.push([btn('↩️ Убрать последний подход', `wo:undo:${item.id}`)]);
  // Одна кнопка перехода: с записанными подходами упражнение засчитывается, без них бот
  // переспрашивает — молча упражнение не засчитывается и не пропускается
  rows.push([btn('➡️ Следующее упражнение', `wo:next:${item.id}`)]);
  rows.push([btn('🏁 Завершить тренировку', `wo:fin:${workout.id}`)]);
  return msg(lines.join('\n'), rows);
}

/** «Следующее упражнение» без единого записанного подхода: что с этим упражнением. */
export function noSetsMessage(item: WorkoutExerciseFull): MessengerMessage {
  return msg(
    `К «${item.exercise.name}» не записано ни одного подхода. Что с упражнением?`,
    [
      [btn('✅ Сделал — засчитать без записи', `wo:done:${item.id}`)],
      [btn('⏭ Не делал — пропустить', `wo:skip:${item.id}`)],
      [btn('⬅️ Вернуться к упражнению', `wo:go:${item.id}`)],
    ],
  );
}

/** Упражнения по порядку закончились, но часть не сделана: завершить или вернуться к пропущенным. */
export function leftoversMessage(workout: WorkoutFull): MessengerMessage {
  const pending = workout.exercises.filter((item) => !isDone(item));
  const done = workout.exercises.length - pending.length;
  return msg(
    [
      `Упражнения по порядку закончились. Сделано ${done} из ${workout.exercises.length}.`,
      '',
      'Не сделано:',
      ...pending.map(
        (item) => `• ${supersetMark(item.superset)}${item.exercise.name}`,
      ),
      hint('Заверши тренировку или вернись к пропущенному упражнению.'),
    ].join('\n'),
    [
      [btn('🏁 Завершить тренировку', `wo:fin:${workout.id}`)],
      ...pending.map((item) => [
        btn(cut(`↩️ ${item.exercise.name}`, 40), `wo:go:${item.id}`),
      ]),
    ],
  );
}

// ── Замена ──────────────────────────────────────────────────────────────

export function analogsMessage(
  itemId: number,
  name: string,
  analogs: { id: number; name: string; status: string }[],
): MessengerMessage {
  // Нужного упражнения среди аналогов может не быть — тогда его создают прямо отсюда
  const create = [btn('➕ Создать своё', `dr:new:ex:${itemId}`)];
  if (!analogs.length)
    return msg(
      `Для «${name}» подходящих аналогов не нашёл. Можно создать своё упражнение.`,
      [create, [btn('⬅️ К тренировке', 'wo:cont')]],
    );
  return msg(`Чем заменить «${name}»?`, [
    ...grid(
      analogs.map((e) =>
        btn(
          cut(`${e.status === 'DRAFT' ? '📝 ' : ''}${e.name}`, 30),
          `sw:pick:${itemId}:${e.id}`,
        ),
      ),
      1,
    ),
    create,
    [btn('⬅️ К тренировке', 'wo:cont')],
  ]);
}

// ── Завершение и заминка ────────────────────────────────────────────────

const summaryText = (result: CompleteResult): string =>
  [
    result.auto
      ? `Тренировку «${result.complexName}» закрыл сам в конце дня — она засчитана ✅`
      : `Тренировка «${result.complexName}» засчитана ✅`,
    `🔥 Серия: ${result.currentStreak}`,
  ].join('\n');

/**
 * Итог без заминки — ответ на вечернее «да»: тренировка давно позади, сообщение показывается
 * пару секунд и удаляется.
 */
export function countedMessage(result: CompleteResult): MessengerMessage {
  return msg(summaryText(result));
}

/**
 * Итог засчитанной тренировки. Заминка — отдельным сообщением по кнопке: его закрывают «Завершить»,
 * а итог с «Поделиться» остаётся в чате.
 */
export function finishedMessage(result: CompleteResult): MessengerMessage {
  // Автозакрытие приходит на следующий день — заминка и кардио уже не к месту, только уведомление
  if (result.auto) return countedMessage(result);
  const cardio = cardioText(result);
  const parts = [
    '🏁 Тренировка закончена!',
    summaryText(result),
    ...(cardio ? [cardio] : []),
  ];
  return msg(parts.join('\n\n'), [
    [btn('🧘 Заминка', `cd:show:${result.workoutId}`)],
    [btn('📤 Поделиться', `wo:share:${result.workoutId}`)],
    [BACK_TO_MENU],
  ]);
}

export interface ShareCardView {
  complexName: string;
  exercises: WorkoutExerciseFull[];
  totals: WorkoutTotals;
  cardioName: string | null;
  cardioMinutes: number | null;
  /** Ссылка на страницу результата; нет — бот в мессенджере не подключён, карточка без кнопки. */
  url?: string;
}

const kg = (value: number): string => `${value.toLocaleString('ru-RU')} кг`;

/**
 * Подходы одного упражнения компактно: подряд идущие на одном весе — одной группой,
 * «60 кг × 10, 10, 8 · 65 кг × 6». Без веса — «× 12, 10», на время — «45 с · 1 мин».
 */
const shareSetsText = (item: WorkoutExerciseFull): string => {
  if (isTimed(item.exercise.measure))
    return item.sets.map((s) => durationText(s.reps)).join(' · ');
  const groups: { weight: number; reps: number[] }[] = [];
  for (const s of item.sets) {
    const weight = Number(s.weight);
    const last = groups.at(-1);
    if (last && last.weight === weight) last.reps.push(s.reps);
    else groups.push({ weight, reps: [s.reps] });
  }
  return groups
    .map(
      (g) =>
        `${g.weight === 0 ? '' : `${num(g.weight)} кг `}× ${g.reps.join(', ')}`,
    )
    .join(' · ');
};

/** Упражнение в карточке: номер, название, подходы; засчитанное без записи — без подходов. */
const shareExerciseText = (
  item: WorkoutExerciseFull,
  index: number,
): string => {
  const name = `${index + 1}. ${supersetMark(item.superset)}${item.exercise.name}`;
  return item.sets.length ? `${name} — ${shareSetsText(item)}` : name;
};

/**
 * Карточка результата для пересылки — как табло финиша: заголовок, цифры одной строкой,
 * затем что именно сделано. Без имени, серии и «N из M»: карточку постят как есть.
 */
export function shareCardMessage(view: ShareCardView): MessengerMessage {
  const { totals } = view;
  const cardio = cardioText(view);
  const stats = [
    `⏱ ${totals.minutes} мин`,
    ...(totals.sets
      ? [`${totals.sets} ${plural(totals.sets, 'подход', 'подхода', 'подходов')}`]
      : []),
    ...(totals.tonnage ? [kg(totals.tonnage)] : []),
  ];
  const lines = [
    `🏁 Тренировка засчитана`,
    `«${view.complexName}»`,
    '',
    stats.join('  ·  '),
    '',
    `💪 Что сделано:`,
    ...view.exercises.filter(isDone).map(shareExerciseText),
    ...(cardio ? [cardio] : []),
  ];
  return msg(
    lines.join('\n'),
    view.url ? [[linkBtn('📊 Смотреть результат', view.url)]] : undefined,
  );
}

/**
 * Заминка. finished — тренировка уже засчитана: добавляется кнопка «Завершить», которой
 * пользователь закрывает заминку. В предпросмотре до конца тренировки кнопки нет.
 */
export function cooldownMessage(
  view: CooldownView,
  finished = true,
): MessengerMessage {
  const all = [...view.main, ...view.optional];
  if (!all.length)
    return msg('🧘 Заминка: подходящих растяжек в справочнике пока нет.');
  const line = (index: number) =>
    `${numEmoji(index + 1)} ${all[index].name} — ${holdText(all[index])}`;
  const lines = [`🧘 Заминка, ~${view.minutes} мин`];
  view.main.forEach((_s, index) => lines.push(line(index)));
  if (view.optional.length) {
    lines.push('', 'Если есть время:');
    view.optional.forEach((_s, index) =>
      lines.push(line(view.main.length + index)),
    );
  }
  return msg(lines.join('\n'), [
    ...grid(
      all.map((s, index) =>
        // w — в карточке растяжки будет «Вернуться», которая её закроет
        btn(`${numEmoji(index + 1)} Как делать`, `sx:v:${s.id}:w`),
      ),
      2,
    ),
    ...(finished ? [[btn('✅ Завершить', 'cd:done')]] : []),
  ]);
}
