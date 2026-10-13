import { numEmoji, btn, cut, fmtDay, grid, msg, hint } from '@/bot';
import { holdText } from '@/catalog/catalog.texts';
import { MessengerButton, MessengerMessage } from '@/messengers';
import { ComplexFull } from '@/program/program.service';
import { cardioText, exercisesCount, planText } from '@/program/program.texts';

import { CooldownView } from './cooldown.service';
import {
  CompleteResult,
  isDone,
  LastResult,
  WorkoutExerciseFull,
  WorkoutFull,
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

/** Один подход: «22 кг × 10 повт.»; без веса — «без веса × 12 повт.». */
const setText = (set: { weight: number; reps: number }): string =>
  `${set.weight === 0 ? 'без веса' : `${num(set.weight)} кг`} × ${set.reps} повт.`;

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
          `${index + 1}. ${item.exercise.name}${warn(item.exercise, limited)} — ${planText(item.sets, item.repsMin, item.repsMax)}`,
      ),
      ...(cardio ? [cardio] : []),
    ].join('\n'),
    [
      [btn('▶️ Начать', `wo:start:${complex.id}`)],
      [btn('🔀 Другой комплекс', 'wo:pick')],
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
  const zones = limitedZones(item.exercise, limited);
  const sets = item.sets.map((s) => ({
    weight: Number(s.weight),
    reps: s.reps,
  }));
  const lines = [
    `${index + 1} из ${workout.exercises.length}. ${item.exercise.name} — ${planText(item.plannedSets, item.repsMin, item.repsMax)}${isDone(item) && item.done ? ' ✅' : ''}`,
  ];
  if (zones) lines.push(`⚠️ Нагружает: ${zones} — заменить?`);
  // Прошлого результата нет — строку не показываем вовсе
  // Прошлый раз и сегодня — два одинаковых блока: подход на строку, сравнивать глазами
  if (last)
    lines.push(
      '',
      `🕓 Прошлый раз (${fmtDay(last.date)}):`,
      ...last.sets.map(setText),
    );
  // Смайл выделяет блок: по нему видно, что только что введённый подход записан
  if (sets.length) lines.push('', '🔥 Сегодня:', ...sets.map(setText));
  // Какой подход сейчас — чтобы не сбиться со счёта между подходами
  lines.push(
    '',
    sets.length < item.plannedSets
      ? `➡️ Сейчас подход ${sets.length + 1} из ${item.plannedSets}.\n${hint('Введи вес и повторы, например «22 10».')}`
      : `Все подходы записаны: ${sets.length} из ${item.plannedSets}.\n${hint(`Жми «Следующее упражнение». Или запиши ещё подход (${sets.length + 1}-й), например «22 10».`)}`,
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
      ...pending.map((item) => `• ${item.exercise.name}`),
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
  if (!analogs.length)
    return msg(`Для «${name}» подходящих аналогов не нашёл.`, [
      [btn('⬅️ К тренировке', 'wo:cont')],
    ]);
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
 * Итог засчитанной тренировки и заминка одним сообщением: итог уходит вместе с заминкой
 * по «Завершить» и не остаётся висеть в чате отдельной строкой.
 */
export function finishedMessage(result: CompleteResult): MessengerMessage {
  const cooldown = cooldownMessage(result.cooldown);
  // Автозакрытие приходит на следующий день — напоминать о кардио уже поздно
  const cardio = result.auto ? null : cardioText(result);
  const parts = [
    summaryText(result),
    ...(cardio ? [cardio] : []),
    cooldown.text,
  ];
  return msg(parts.join('\n\n'), [
    ...(cooldown.buttons ?? []),
    // Без растяжек кнопки «Завершить» нет — иначе итог было бы нечем закрыть
    ...(cooldown.buttons ? [] : [[btn('✅ Завершить', 'cd:done')]]),
  ]);
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

/** Итог после «Завершить» под заминкой: показывается пару секунд, затем сменяется меню. */
export function cooldownDoneMessage(): MessengerMessage {
  return msg('🧘 Заминка сделана ✅ Отличная работа, до следующей тренировки!');
}
