import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { NavLink, useLocation, useNavigate } from 'react-router'

import { ROUTES } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { Eyebrow, Lead, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'
import { MiniAppShell } from '@/widgets/miniapp/MiniAppShell'

// Все экраны макета по порядку пути пользователя: вход → день → тренировка → разделы → админ
const SCREENS = [
  { label: 'Первый запуск', to: ROUTES.PREVIEW_ONBOARDING },
  { label: 'Ошибки входа', to: '/preview/entry/outside' },
  { label: 'Сегодня', to: ROUTES.PREVIEW_TODAY },
  { label: 'Тренировка', to: ROUTES.PREVIEW_WORKOUT },
  { label: 'Замена упражнения', to: ROUTES.PREVIEW_WORKOUT_REPLACE },
  { label: 'Итог', to: ROUTES.PREVIEW_SUMMARY },
  { label: 'Заминка', to: ROUTES.PREVIEW_COOLDOWN },
  { label: 'Программы', to: ROUTES.PREVIEW_PROGRAMS },
  { label: 'Редактор программы', to: '/preview/programs/1' },
  { label: 'Подбор упражнений', to: '/preview/programs/1/add/11' },
  { label: 'Шаблоны', to: ROUTES.PREVIEW_PROGRAM_TEMPLATES },
  { label: 'Шаблон', to: '/preview/programs/templates/2' },
  { label: 'Справочник', to: ROUTES.PREVIEW_LIBRARY },
  { label: 'Упражнение', to: '/preview/library/exercises/1' },
  { label: 'Растяжка', to: '/preview/library/stretches/3' },
  { label: 'Своё упражнение', to: ROUTES.PREVIEW_LIBRARY_NEW },
  { label: 'Статистика', to: ROUTES.PREVIEW_STATS },
  { label: 'Профиль', to: ROUTES.PREVIEW_PROFILE },
  { label: 'Профиль друга', to: '/preview/friends/1' },
  { label: 'Админ', to: ROUTES.PREVIEW_ADMIN },
  { label: 'Админ · заявка', to: '/preview/admin/moderation/1' },
  { label: 'Админ · запись', to: '/preview/admin/catalog/exercise/1' },
  { label: 'Админ · шаблон', to: '/preview/admin/templates/1' },
  { label: 'UI-кит', to: ROUTES.PREVIEW_UI },
]

const ThemeSwitch = () => {
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  return (
    <Button
      variant='outline'
      size='icon'
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label='Сменить тему'
      className='shrink-0'
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}

// Стенд превью: на широком экране — список экранов слева, на телефоне — лента экранов под колонкой
const PreviewLayout = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <div className='sb bg-background text-foreground min-h-svh lg:bg-[color-mix(in_oklab,var(--sb-paper),var(--sb-blue)_6%)]'>
      <aside className='fixed top-0 left-0 hidden h-svh w-[300px] flex-col justify-between overflow-y-auto p-8 lg:flex'>
        <div>
          <Eyebrow
            as='p'
            tone='primary'
          >
            Mini App · превью дизайна
          </Eyebrow>
          <Poster
            as='h1'
            size='2xl'
            tone='primary'
            className='mt-3'
          >
            Спорт
            <br />
            бот
          </Poster>
          <Lead
            size='sm'
            tone='soft'
            className='mt-2'
          >
            макет на моковых данных
          </Lead>
          <ol className='border-border mt-5 border-t-[1.5px]'>
            {SCREENS.map((s, i) => (
              <li key={s.to}>
                <NavLink
                  to={s.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      'border-border flex items-baseline gap-3 border-b-[1.5px] py-1.5 transition-colors',
                      isActive ? 'text-primary' : 'text-foreground/60 hover:text-foreground',
                    )
                  }
                >
                  <Poster
                    as='span'
                    size='xs'
                    className='w-6'
                  >
                    {String(i + 1).padStart(2, '0')}
                  </Poster>
                  <Text
                    as='span'
                    size='sm'
                  >
                    {s.label}
                  </Text>
                </NavLink>
              </li>
            ))}
          </ol>
        </div>
        <div className='mt-6 flex items-center gap-3'>
          <ThemeSwitch />
          <Eyebrow>Тема из мессенджера</Eyebrow>
        </div>
      </aside>

      <MiniAppShell
        isAdmin
        className='lg:border-border lg:border-x-[1.5px]'
      />

      {/* На телефоне: быстрый переход между экранами превью */}
      <div className='no-scrollbar border-border flex items-center gap-2 overflow-x-auto border-t-[1.5px] px-4 py-3 lg:hidden'>
        <ThemeSwitch />
        <ToggleGroup
          value={[pathname]}
          onValueChange={([to]) => to && navigate(to)}
          spacing={2}
        >
          {SCREENS.map(s => (
            <ToggleGroupItem
              key={s.to}
              value={s.to}
              size='sm'
            >
              {s.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  )
}

export default PreviewLayout
