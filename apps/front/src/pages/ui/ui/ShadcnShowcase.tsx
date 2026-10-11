import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { FileTextIcon, InboxIcon, InfoIcon, TriangleAlertIcon, XIcon } from 'lucide-react'

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/ui/shadcn/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/shadcn/alert-dialog'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/shared/ui/shadcn/attachment'
import { Badge } from '@/shared/ui/shadcn/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/shadcn/breadcrumb'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Calendar } from '@/shared/ui/shadcn/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/shadcn/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/shadcn/chart'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/shared/ui/shadcn/drawer'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/ui/shadcn/empty'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/shared/ui/shadcn/field'
import { Input } from '@/shared/ui/shadcn/input'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/shared/ui/shadcn/input-otp'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/shared/ui/shadcn/item'
import { Label } from '@/shared/ui/shadcn/label'
import { ScrollArea } from '@/shared/ui/shadcn/scroll-area'
import { Separator } from '@/shared/ui/shadcn/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/shadcn/sheet'
import { Skeleton } from '@/shared/ui/shadcn/skeleton'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { toast } from '@/shared/ui/shadcn/toast'

import DemoSection from './DemoSection'

const P = '@/shared/ui/shadcn'

const chartData = [
  { month: 'Янв', value: 186 },
  { month: 'Фев', value: 305 },
  { month: 'Мар', value: 237 },
  { month: 'Апр', value: 73 },
  { month: 'Май', value: 209 },
]

const chartConfig = {
  value: { label: 'Продажи', color: 'var(--chart-1)' },
} satisfies ChartConfig

const tableRows = [
  { id: 'INV-001', status: 'Оплачен', amount: '2 500 ₽' },
  { id: 'INV-002', status: 'Ожидает', amount: '1 200 ₽' },
  { id: 'INV-003', status: 'Отменён', amount: '800 ₽' },
]

const ShadcnShowcase = () => {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DemoSection title="Button" path={`${P}/button`}>
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button disabled>Disabled</Button>
      </DemoSection>

      <DemoSection title="Badge" path={`${P}/badge`}>
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="ghost">Ghost</Badge>
      </DemoSection>

      <DemoSection title="Alert" path={`${P}/alert`}>
        <Alert>
          <InfoIcon />
          <AlertTitle>Обновление</AlertTitle>
          <AlertDescription>Новая версия доступна для установки.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>Не удалось сохранить изменения.</AlertDescription>
        </Alert>
      </DemoSection>

      <DemoSection title="Card" path={`${P}/card`}>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Заголовок карточки</CardTitle>
            <CardDescription>Краткое описание содержимого.</CardDescription>
          </CardHeader>
          <CardContent>Основной контент карточки.</CardContent>
          <CardFooter>
            <Button size="sm">Действие</Button>
          </CardFooter>
        </Card>
      </DemoSection>

      <DemoSection title="Input · Textarea · Label" path={`${P}/input, textarea, label`}>
        <div className="flex w-full max-w-sm flex-col gap-2">
          <Label htmlFor="demo-email">Email</Label>
          <Input id="demo-email" type="email" placeholder="you@example.com" />
        </div>
        <div className="flex w-full max-w-sm flex-col gap-2">
          <Label htmlFor="demo-message">Сообщение</Label>
          <Textarea id="demo-message" placeholder="Введите текст" />
        </div>
      </DemoSection>

      <DemoSection title="Field" path={`${P}/field`}>
        <FieldGroup className="w-full max-w-sm">
          <Field>
            <FieldLabel htmlFor="demo-name">Имя</FieldLabel>
            <Input id="demo-name" placeholder="Иван" />
            <FieldDescription>Как к вам обращаться.</FieldDescription>
          </Field>
          <Field data-invalid>
            <FieldLabel htmlFor="demo-phone">Телефон</FieldLabel>
            <Input id="demo-phone" aria-invalid placeholder="+7" />
            <FieldError>Неверный формат номера</FieldError>
          </Field>
        </FieldGroup>
      </DemoSection>

      <DemoSection title="Input OTP" path={`${P}/input-otp`}>
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </DemoSection>

      <DemoSection title="Calendar" path={`${P}/calendar`}>
        <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-lg border" />
      </DemoSection>

      <DemoSection title="Dialog · Alert Dialog · Sheet · Drawer" path={`${P}/dialog, alert-dialog, sheet, drawer`}>
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>Dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Диалог</DialogTitle>
              <DialogDescription>Модальное окно с произвольным контентом.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button>Сохранить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" />}>Alert Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
              <AlertDialogDescription>Действие нельзя отменить.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction>Удалить</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Боковая панель</SheetTitle>
              <SheetDescription>Выезжает справа.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>

        <Drawer>
          <DrawerTrigger render={<Button variant="outline" />}>Drawer</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Шторка</DrawerTitle>
              <DrawerDescription>Выезжает снизу, удобно на мобильных.</DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      </DemoSection>

      <DemoSection title="Toast" path={`${P}/toast`}>
        <Button variant="outline" onClick={() => toast.add({ title: 'Готово', description: 'Изменения сохранены', type: 'success' })}>
          Success
        </Button>
        <Button variant="outline" onClick={() => toast.add({ title: 'Ошибка', description: 'Что-то пошло не так', type: 'error' })}>
          Error
        </Button>
      </DemoSection>

      <DemoSection title="Breadcrumb" path={`${P}/breadcrumb`}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Главная</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Раздел</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Страница</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </DemoSection>

      <DemoSection title="Item" path={`${P}/item`}>
        <Item variant="outline" className="w-full max-w-sm">
          <ItemMedia variant="icon">
            <FileTextIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Отчёт за месяц</ItemTitle>
            <ItemDescription>PDF · 1.2 МБ</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button size="sm" variant="outline">Открыть</Button>
          </ItemActions>
        </Item>
      </DemoSection>

      <DemoSection title="Attachment" path={`${P}/attachment`}>
        <Attachment className="w-full max-w-sm">
          <AttachmentMedia>
            <FileTextIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>document.pdf</AttachmentTitle>
            <AttachmentDescription>240 КБ</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Удалить">
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
        <Attachment state="uploading" className="w-full max-w-sm">
          <AttachmentMedia>
            <Spinner />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>photo.jpg</AttachmentTitle>
            <AttachmentDescription>Загрузка…</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      </DemoSection>

      <DemoSection title="Empty" path={`${P}/empty`}>
        <Empty className="w-full border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>Пока пусто</EmptyTitle>
            <EmptyDescription>Здесь появятся ваши записи.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm">Создать</Button>
          </EmptyContent>
        </Empty>
      </DemoSection>

      <DemoSection title="Table" path={`${P}/table`}>
        <Table>
          <TableCaption>Последние счета</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Номер</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.id}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell className="text-right">{row.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DemoSection>

      <DemoSection title="Chart" path={`${P}/chart`}>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={6} />
          </BarChart>
        </ChartContainer>
      </DemoSection>

      <DemoSection title="Scroll Area · Separator" path={`${P}/scroll-area, separator`}>
        <ScrollArea className="h-40 w-48 rounded-lg border">
          <div className="p-4">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i}>
                <div className="py-1 text-sm">Тег v1.{i}</div>
                <Separator />
              </div>
            ))}
          </div>
        </ScrollArea>
      </DemoSection>

      <DemoSection title="Skeleton · Spinner" path={`${P}/skeleton, spinner`}>
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <Spinner />
      </DemoSection>
    </div>
  )
}

export default ShadcnShowcase
