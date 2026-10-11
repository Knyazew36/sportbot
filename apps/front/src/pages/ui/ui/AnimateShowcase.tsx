import { HeartIcon, HomeIcon, InboxIcon, SettingsIcon } from 'lucide-react'

import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@/shared/ui/shadcn/animate-ui/components/animate/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/shadcn/animate-ui/components/animate/tooltip'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CopyButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/copy'
import { IconButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/icon'
import { RippleButton, RippleButtonRipples } from '@/shared/ui/shadcn/animate-ui/components/buttons/ripple'
import { ThemeTogglerButton } from '@/shared/ui/shadcn/animate-ui/components/buttons/theme-toggler'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/shadcn/animate-ui/components/radix/accordion'
import { Checkbox } from '@/shared/ui/shadcn/animate-ui/components/radix/checkbox'
import {
  FileItem,
  Files,
  FolderContent,
  FolderItem,
  FolderTrigger,
  SubFiles,
} from '@/shared/ui/shadcn/animate-ui/components/radix/files'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/shadcn/animate-ui/components/radix/radio-group'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/shared/ui/shadcn/animate-ui/components/radix/sidebar'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { Label } from '@/shared/ui/shadcn/label'

import DemoSection from './DemoSection'

const P = '@/shared/ui/shadcn/animate-ui/components'

const sidebarItems = [
  { title: 'Главная', icon: HomeIcon },
  { title: 'Входящие', icon: InboxIcon },
  { title: 'Настройки', icon: SettingsIcon },
]

const AnimateShowcase = () => {
  return (
    <TooltipProvider>
      <div className="grid gap-6 lg:grid-cols-2">
        <DemoSection title="Button" path={`${P}/buttons/button`}>
          <Button>Default</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
        </DemoSection>

        <DemoSection title="Ripple · Icon · Copy · Theme Toggler" path={`${P}/buttons/*`}>
          <RippleButton>
            Ripple
            <RippleButtonRipples />
          </RippleButton>
          <IconButton>
            <HeartIcon />
          </IconButton>
          <CopyButton content="Скопированный текст" />
          <ThemeTogglerButton variant="outline" />
        </DemoSection>

        <DemoSection title="Tabs" path={`${P}/animate/tabs`}>
          <Tabs defaultValue="account" className="w-full max-w-sm">
            <TabsList>
              <TabsTrigger value="account">Аккаунт</TabsTrigger>
              <TabsTrigger value="password">Пароль</TabsTrigger>
            </TabsList>
            <TabsContents className="rounded-lg border p-4">
              <TabsContent value="account">Настройки аккаунта.</TabsContent>
              <TabsContent value="password">Смена пароля.</TabsContent>
            </TabsContents>
          </Tabs>
        </DemoSection>

        <DemoSection title="Tooltip" path={`${P}/animate/tooltip`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Наведи на меня</Button>
            </TooltipTrigger>
            <TooltipContent>Подсказка</TooltipContent>
          </Tooltip>
        </DemoSection>

        <DemoSection title="Accordion" path={`${P}/radix/accordion`}>
          <Accordion type="single" collapsible className="w-full max-w-sm">
            <AccordionItem value="1">
              <AccordionTrigger>Что это?</AccordionTrigger>
              <AccordionContent>Анимированный аккордеон на Radix.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="2">
              <AccordionTrigger>Можно кастомизировать?</AccordionTrigger>
              <AccordionContent>Да, исходники лежат в проекте.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </DemoSection>

        <DemoSection title="Checkbox · Switch · Radio Group" path={`${P}/radix/checkbox, switch, radio-group`}>
          <div className="flex items-center gap-2">
            <Checkbox id="demo-checkbox" defaultChecked />
            <Label htmlFor="demo-checkbox">Checkbox</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="demo-switch" />
            <Label htmlFor="demo-switch">Switch</Label>
          </div>
          <RadioGroup defaultValue="a">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="a" id="demo-radio-a" />
              <Label htmlFor="demo-radio-a">Вариант A</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="b" id="demo-radio-b" />
              <Label htmlFor="demo-radio-b">Вариант B</Label>
            </div>
          </RadioGroup>
        </DemoSection>

        <DemoSection title="Files" path={`${P}/radix/files`}>
          <div className="w-full max-w-sm rounded-lg border">
            <Files defaultOpen={['src']}>
              <FolderItem value="src">
                <FolderTrigger>src</FolderTrigger>
                <FolderContent>
                  <SubFiles>
                    <FileItem>main.tsx</FileItem>
                    <FileItem>App.tsx</FileItem>
                  </SubFiles>
                </FolderContent>
              </FolderItem>
              <FileItem>package.json</FileItem>
            </Files>
          </div>
        </DemoSection>

        <DemoSection title="Sidebar" path={`${P}/radix/sidebar`}>
          {/* collapsible="none" рендерит статичный блок, иначе sidebar встаёт fixed поверх всей страницы */}
          <SidebarProvider className="min-h-0 w-auto rounded-lg border">
            <Sidebar collapsible="none">
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>Навигация</SidebarGroupLabel>
                  <SidebarMenu>
                    {sidebarItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton isActive={item.title === 'Главная'}>
                          <item.icon />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
          </SidebarProvider>
        </DemoSection>
      </div>
    </TooltipProvider>
  )
}

export default AnimateShowcase
