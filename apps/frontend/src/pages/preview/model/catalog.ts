import type { ExerciseDto, JointDto, MuscleDto, MyEntryDto, StretchDto } from '@/entities/catalog/types'

// Моки справочника: настоящие записи из apps/server/prisma/content/catalog.json. Картинки — исходные ссылки
// импорта (free-exercise-db), чтобы были видны без бэка; API отдаст вместо них /api/uploads/catalog/<uuid>.jpg

// Закрытые справочники: порядок мышц — сверху вниз по телу, как в сиде
export const muscles: MuscleDto[] = [
  { id: 1, code: 'traps', name: 'Трапеции' },
  { id: 2, code: 'front-delts', name: 'Передние дельты' },
  { id: 3, code: 'mid-delts', name: 'Средние дельты' },
  { id: 4, code: 'rear-delts', name: 'Задние дельты' },
  { id: 5, code: 'chest', name: 'Грудь' },
  { id: 6, code: 'lats', name: 'Широчайшие' },
  { id: 7, code: 'biceps', name: 'Бицепс' },
  { id: 8, code: 'triceps', name: 'Трицепс' },
  { id: 9, code: 'forearms', name: 'Предплечья' },
  { id: 10, code: 'abs', name: 'Пресс' },
  { id: 11, code: 'lower-back', name: 'Разгибатели спины' },
  { id: 12, code: 'glutes', name: 'Ягодичные' },
  { id: 13, code: 'quads', name: 'Квадрицепс' },
  { id: 14, code: 'hamstrings', name: 'Бицепс бедра' },
  { id: 15, code: 'adductors', name: 'Приводящие' },
  { id: 16, code: 'calves', name: 'Икры' },
]

export const joints: JointDto[] = [
  { id: 1, code: 'neck', name: 'Шея' },
  { id: 2, code: 'shoulder', name: 'Плечо' },
  { id: 3, code: 'elbow', name: 'Локоть' },
  { id: 4, code: 'wrist', name: 'Запястье' },
  { id: 5, code: 'lower-back', name: 'Поясница' },
  { id: 6, code: 'hip', name: 'Тазобедренный' },
  { id: 7, code: 'knee', name: 'Колено' },
  { id: 8, code: 'ankle', name: 'Голеностоп' },
]

// Код из импорта гарантированно есть в сиде: промах — ошибка в моках, а не в данных пользователя
const m = (code: string) => muscles.find(x => x.code === code)!
const j = (code: string) => joints.find(x => x.code === code)!

export const exercises: ExerciseDto[] = [
  {
    id: 1,
    name: 'Жим штанги лёжа',
    imageUrl:
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg',
    equipment: 'BARBELL',
    status: 'CATALOG',
    primaryMuscles: [m('chest')],
    secondaryMuscles: [m('triceps'), m('front-delts')],
    joints: [j('shoulder'), j('elbow'), j('wrist')],
    technique:
      'Лопатки сведены и прижаты к скамье, стопы упираются в пол. Гриф опускается на низ груди, локти под углом около 45° к корпусу. Жми вверх и слегка назад, к стойкам.\nОшибки: отрыв таза от скамьи, отбив грифа от груди, локти строго в стороны.',
    videoUrl:
      'https://www.youtube.com/results?search_query=\u0416\u0438\u043c+\u0448\u0442\u0430\u043d\u0433\u0438+\u043b\u0451\u0436\u0430',
  },
  {
    id: 2,
    name: 'Жим гантелей на наклонной скамье',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Press/0.jpg',
    equipment: 'DUMBBELL',
    status: 'CATALOG',
    primaryMuscles: [m('chest')],
    secondaryMuscles: [m('front-delts'), m('triceps')],
    joints: [j('shoulder'), j('elbow')],
    technique:
      'Наклон 30–45°, гантели над верхом груди. Опускай подконтрольно, предплечья вертикальны.\nОшибки: прогиб в пояснице с отрывом таза, жим «к лицу».',
    videoUrl:
      'https://www.youtube.com/results?search_query=\u0416\u0438\u043c+\u0433\u0430\u043d\u0442\u0435\u043b\u0435\u0439+\u043d\u0430+\u043d\u0430\u043a\u043b\u043e\u043d\u043d\u043e\u0439+\u0441\u043a\u0430\u043c\u044c\u0435',
  },
  {
    id: 3,
    name: 'Сведение рук в кроссовере',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crossover/0.jpg',
    equipment: 'MACHINE',
    status: 'CATALOG',
    primaryMuscles: [m('chest')],
    secondaryMuscles: [m('front-delts')],
    joints: [j('shoulder')],
    technique:
      'Шаг вперёд, корпус слегка наклонён. Своди рукояти перед собой по дуге, локти зафиксированы.\nОшибки: сгибание локтей — превращается в жим, работа инерцией.',
    videoUrl:
      'https://www.youtube.com/results?search_query=\u0421\u0432\u0435\u0434\u0435\u043d\u0438\u0435+\u0440\u0443\u043a+\u0432+\u043a\u0440\u043e\u0441\u0441\u043e\u0432\u0435\u0440\u0435',
  },
  {
    id: 4,
    name: 'Отжимания на брусьях',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dips_-_Chest_Version/0.jpg',
    equipment: 'BODYWEIGHT',
    status: 'CATALOG',
    primaryMuscles: [m('chest'), m('triceps')],
    secondaryMuscles: [m('front-delts')],
    joints: [j('shoulder'), j('elbow')],
    technique:
      'Корпус слегка наклонён вперёд, локти идут назад и немного в стороны. Опускайся до угла в локте около 90°.\nОшибки: слишком глубокое опускание, плечи подняты к ушам, раскачка.',
    videoUrl:
      'https://www.youtube.com/results?search_query=\u041e\u0442\u0436\u0438\u043c\u0430\u043d\u0438\u044f+\u043d\u0430+\u0431\u0440\u0443\u0441\u044c\u044f\u0445',
  },
  {
    id: 5,
    name: 'Подтягивания широким хватом',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pullups/0.jpg',
    equipment: 'BODYWEIGHT',
    status: 'CATALOG',
    primaryMuscles: [m('lats')],
    secondaryMuscles: [m('biceps'), m('rear-delts'), m('forearms')],
    joints: [j('shoulder'), j('elbow')],
    technique:
      'Начинай движение с опускания лопаток, тянись грудью к перекладине. Опускайся подконтрольно до почти прямых рук.\nОшибки: раскачка, подтягивание подбородком за счёт шеи, половинная амплитуда.',
    videoUrl: null,
  },
  {
    id: 6,
    name: 'Тяга верхнего блока к груди',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/0.jpg',
    equipment: 'MACHINE',
    status: 'CATALOG',
    primaryMuscles: [m('lats')],
    secondaryMuscles: [m('biceps'), m('rear-delts')],
    joints: [j('shoulder'), j('elbow')],
    technique:
      'Бёдра зафиксированы валиком, корпус слегка отклонён. Тяни рукоять к верху груди, сводя лопатки, локти вниз.\nОшибки: тяга за голову, сильный отклон назад с рывком.',
    videoUrl: null,
  },
  {
    id: 7,
    name: 'Подъём штанги на бицепс',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Curl/0.jpg',
    equipment: 'BARBELL',
    status: 'CATALOG',
    primaryMuscles: [m('biceps')],
    secondaryMuscles: [m('forearms')],
    joints: [j('elbow'), j('wrist')],
    technique:
      'Локти прижаты к корпусу и неподвижны. Поднимай гриф до уровня плеч, опускай медленно.\nОшибки: раскачка корпусом, вынос локтей вперёд.',
    videoUrl: null,
  },
  {
    id: 8,
    name: 'Разгибание рук на блоке',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown/0.jpg',
    equipment: 'MACHINE',
    status: 'CATALOG',
    primaryMuscles: [m('triceps')],
    secondaryMuscles: [],
    joints: [j('elbow')],
    technique:
      'Локти прижаты к бокам и неподвижны. Разгибай руки до конца, вверх возвращай до угла 90°.\nОшибки: подключение плеч и корпуса, локти гуляют вперёд-назад.',
    videoUrl: null,
  },
  {
    id: 9,
    name: 'Французский жим лёжа',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/EZ-Bar_Skullcrusher/0.jpg',
    equipment: 'BARBELL',
    status: 'CATALOG',
    primaryMuscles: [m('triceps')],
    secondaryMuscles: [],
    joints: [j('elbow'), j('wrist')],
    technique:
      'Плечи вертикальны или чуть отклонены к голове. Сгибай только локти, опуская гриф ко лбу или за голову.\nОшибки: разведение локтей, движение в плечах.',
    videoUrl: null,
  },
  {
    id: 10,
    name: 'Махи гантелями в стороны',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Lateral_Raise/0.jpg',
    equipment: 'DUMBBELL',
    status: 'CATALOG',
    primaryMuscles: [m('mid-delts')],
    secondaryMuscles: [m('traps')],
    joints: [j('shoulder')],
    technique:
      'Локти чуть согнуты, поднимай руки через стороны до уровня плеч, мизинец чуть выше большого пальца.\nОшибки: раскачка корпусом, подъём выше плеч с включением трапеций.',
    videoUrl: null,
  },
  {
    id: 11,
    name: 'Приседания со штангой',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/0.jpg',
    equipment: 'BARBELL',
    status: 'CATALOG',
    primaryMuscles: [m('quads'), m('glutes')],
    secondaryMuscles: [m('hamstrings'), m('lower-back'), m('adductors')],
    joints: [j('knee'), j('hip'), j('lower-back'), j('ankle')],
    technique:
      'Гриф на трапециях, стопы чуть шире плеч, носки слегка врозь. Садись, отводя таз назад, колени идут в сторону носков, спина прямая.\nОшибки: сведение коленей внутрь, отрыв пяток, округление поясницы внизу.',
    videoUrl: null,
  },
  {
    id: 12,
    name: 'Жим ногами',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Press/0.jpg',
    equipment: 'MACHINE',
    status: 'CATALOG',
    primaryMuscles: [m('quads'), m('glutes')],
    secondaryMuscles: [m('hamstrings'), m('adductors')],
    joints: [j('knee'), j('hip')],
    technique:
      'Поясница прижата к спинке. Опускай платформу до угла в коленях около 90°, выжимай, не выпрямляя колени «в замок».\nОшибки: отрыв таза от спинки, сведение коленей.',
    videoUrl: null,
  },
  {
    id: 13,
    name: 'Румынская тяга',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/0.jpg',
    equipment: 'BARBELL',
    status: 'CATALOG',
    primaryMuscles: [m('hamstrings'), m('glutes')],
    secondaryMuscles: [m('lower-back'), m('forearms')],
    joints: [j('lower-back'), j('hip')],
    technique:
      'Колени чуть согнуты и зафиксированы. Отводи таз назад, гриф скользит по ногам до середины голени, спина прямая.\nОшибки: округление спины, приседание вместо наклона.',
    videoUrl: null,
  },
  {
    id: 14,
    name: 'Планка',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/0.jpg',
    equipment: 'BODYWEIGHT',
    status: 'CATALOG',
    primaryMuscles: [m('abs')],
    secondaryMuscles: [m('lower-back'), m('front-delts')],
    joints: [j('shoulder'), j('lower-back')],
    technique:
      'Локти под плечами, тело — прямая линия, пресс и ягодицы напряжены. В плане повторов — секунды удержания.\nОшибки: провисание поясницы, поднятый таз.',
    videoUrl: null,
  },
]

export const stretches: StretchDto[] = [
  {
    id: 1,
    name: 'Растяжка груди у стены',
    imageUrl: null,
    howTo: 'Встань боком к стене, ладонь и предплечье — на стену на уровне плеча. Плавно разворачивай корпус от стены.',
    holdSeconds: 30,
    perSide: true,
    status: 'CATALOG',
    muscles: [m('chest'), m('front-delts')],
  },
  {
    id: 2,
    name: 'Растяжка груди в дверном проёме',
    imageUrl: null,
    howTo: 'Упрись предплечьями в косяки на уровне плеч и подай корпус вперёд до растяжения груди.',
    holdSeconds: 30,
    perSide: false,
    status: 'CATALOG',
    muscles: [m('chest')],
  },
  {
    id: 3,
    name: 'Растяжка трицепса за головой',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Stretch/0.jpg',
    howTo: 'Подними руку и согни её за головой, второй рукой мягко надави на локоть вниз и назад.',
    holdSeconds: 30,
    perSide: true,
    status: 'CATALOG',
    muscles: [m('triceps')],
  },
  {
    id: 4,
    name: 'Вис на перекладине',
    imageUrl: null,
    howTo: 'Повисни на прямых руках, расслабь плечи и спину, дыши ровно.',
    holdSeconds: 30,
    perSide: false,
    status: 'CATALOG',
    muscles: [m('lats'), m('forearms')],
  },
  {
    id: 5,
    name: 'Наклон к ноге сидя',
    imageUrl:
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Floor_Hamstring_Stretch/0.jpg',
    howTo: 'Сидя, одна нога прямая, стопа второй у бедра. Тянись грудью к прямой ноге.',
    holdSeconds: 30,
    perSide: true,
    status: 'CATALOG',
    muscles: [m('hamstrings')],
  },
  {
    id: 6,
    name: 'Растяжка квадрицепса стоя',
    imageUrl: null,
    howTo: 'Стоя, согни ногу и возьмись за стопу, подтяни пятку к ягодице. Колени рядом, таз подкручен вперёд.',
    holdSeconds: 30,
    perSide: true,
    status: 'CATALOG',
    muscles: [m('quads')],
  },
  {
    id: 7,
    name: 'Поза ребёнка',
    imageUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Childs_Pose/0.jpg',
    howTo: 'Сядь на пятки, наклонись вперёд и вытяни руки по полу. Тянись пальцами вперёд, таз держи у пяток.',
    holdSeconds: 40,
    perSide: false,
    status: 'CATALOG',
    muscles: [m('lats'), m('lower-back')],
  },
  {
    id: 8,
    name: 'Растяжка икр у стены',
    imageUrl:
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Calf_Stretch_Hands_Against_Wall/0.jpg',
    howTo: 'Упрись руками в стену, заднюю ногу выпрями, пятку прижми к полу и подай таз вперёд.',
    holdSeconds: 30,
    perSide: true,
    status: 'CATALOG',
    muscles: [m('calves')],
  },
]

// ── Мои записи ──────────────────────────────────────────────────────────────

export const myEntries: MyEntryDto[] = [
  {
    id: 101,
    kind: 'exercise',
    name: 'Молотки с гантелями сидя',
    muscles: [m('biceps'), m('forearms')],
    outcome: 'PENDING',
    reason: null,
    catalogId: null,
    createdAt: '13 октября',
  },
  {
    id: 102,
    kind: 'exercise',
    name: 'Жим лёжа узким хватом',
    muscles: [m('triceps'), m('chest')],
    outcome: 'APPROVED_EDITED',
    reason: 'Добавили картинку и суставы',
    catalogId: 9,
    createdAt: '2 октября',
  },
  {
    id: 103,
    kind: 'exercise',
    name: 'Тяга вертикального блока',
    muscles: [m('lats')],
    outcome: 'DUPLICATE',
    reason: 'Уже есть в справочнике',
    catalogId: 6,
    createdAt: '28 сентября',
  },
  {
    id: 104,
    kind: 'stretch',
    name: 'Растяжка на ролике',
    muscles: [m('lats')],
    outcome: 'REJECTED',
    reason: 'Это самомассаж, а не растяжка',
    catalogId: null,
    createdAt: '20 сентября',
  },
]

/** Лимит заявок на модерацию в сутки, упражнения и растяжки вместе (business-tz, 5.5) */
export const DAILY_SUBMISSIONS = { used: 2, limit: 5 }
