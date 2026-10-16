import * as React from "react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { cn } from "@/shared/lib/utils"

import { Button } from "@/shared/ui/shadcn/animate-ui/components/buttons/button"
import { XIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const toast = ToastPrimitive.createToastManager()

function ToastProvider({ ...props }: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />
}

function ToastPortal({ ...props }: ToastPrimitive.Portal.Props) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />
}

function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        // Сверху: снизу тост закрывают липкая кнопка экрана и меню.
        // В полноэкранном Telegram опускаем под его «Закрыть» и меню (--sb-top-inset), иначе тост ляжет на них
        "pointer-events-none fixed inset-x-4 top-(--toast-top) z-100 [--toast-top:max(1rem,env(safe-area-inset-top),calc(var(--sb-top-inset)+0.5rem))] mx-auto w-auto max-w-sm outline-none",
        className
      )}
      {...props}
    />
  )
}

// Карточка в стиле кнопок проекта: рамка и жёсткая тень, у ошибки — красные. Стопка растёт вниз от верха экрана.
// Уходит на свою высоту плюс отступ вьюпорта (--exit-y): фиксированные -150% в полноэкранном Telegram
// не дотягивали до края, и тост застывал у верха экрана
function Toast({ className, ...props }: ToastPrimitive.Root.Props) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      swipeDirection={["up", "right"]}
      className={cn(
        "group/toast pointer-events-auto absolute top-0 right-0 z-[calc(1000-var(--toast-index))] w-full origin-top border-[1.5px] border-foreground bg-background text-foreground shadow-[4px_4px_0_var(--sb-ink)] will-change-transform outline-none select-none focus-visible:ring-4 focus-visible:ring-ring/25",
        "data-[type=error]:border-destructive data-[type=error]:shadow-[4px_4px_0_var(--sb-danger)]",
        // Успех — мятная заливка, как у кнопки success; текст чёрный и в тёмной теме
        "data-[type=success]:bg-success data-[type=success]:text-black",
        "[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)+calc(var(--toast-index)*var(--gap))+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--exit-y:calc(-100%-var(--toast-top)-8px)] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]",
        "h-(--height) [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+(var(--toast-index)*var(--peek))+(var(--shrink)*var(--height))))_scale(var(--scale))] [transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms]",
        "after:absolute after:bottom-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
        "data-expanded:h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]",
        "data-limited:opacity-0 data-starting-style:[transform:translateY(var(--exit-y))]",
        "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(var(--exit-y))]",
        "data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)+var(--exit-y)))]",
        "data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)+var(--exit-y)))]",
        "data-expanded:data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        className
      )}
      {...props}
    />
  )
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        "flex h-full items-center gap-3 overflow-hidden py-3 pr-2 pl-4 transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-behind:opacity-0 data-expanded:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn("font-grotesk text-[15px] leading-snug font-medium tracking-[-0.02em]", className)}
      {...props}
    />
  )
}

function ToastDescription({
  className,
  ...props
}: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("font-grotesk text-[14px] leading-snug tracking-[-0.02em] text-muted-foreground group-data-[type=success]/toast:text-black/70", className)}
      {...props}
    />
  )
}

function ToastAction({
  className,
  render = <Button variant="outline" size="sm" />,
  ...props
}: ToastPrimitive.Action.Props) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={cn("shrink-0", className)}
      {...props}
    />
  )
}

function ToastClose({
  className,
  children,
  render = <Button variant="ghost" size="icon-sm" />,
  ...props
}: ToastPrimitive.Close.Props) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Закрыть"
      render={render}
      className={cn(
        "relative shrink-0 text-muted-foreground after:absolute after:-inset-2 after:content-[''] hover:text-foreground group-data-[type=success]/toast:text-black/60 group-data-[type=success]/toast:hover:bg-black/10 group-data-[type=success]/toast:hover:text-black",
        className
      )}
      {...props}
    >
      {children ?? (
        <XIcon aria-hidden="true" />
      )}
    </ToastPrimitive.Close>
  )
}

function ToastIcon({ type }: { type: string | undefined }) {
  let icon: React.ReactNode = null

  if (type === "success") {
    icon = (
      <CircleCheckIcon aria-hidden="true" />
    )
  }

  if (type === "info") {
    icon = (
      <InfoIcon aria-hidden="true" />
    )
  }

  if (type === "warning") {
    icon = (
      <TriangleAlertIcon aria-hidden="true" />
    )
  }

  if (type === "error") {
    icon = (
      <OctagonXIcon className="text-destructive" aria-hidden="true" />
    )
  }

  if (type === "loading") {
    icon = (
      <Loader2Icon className="animate-spin" aria-hidden="true" />
    )
  }

  if (!icon) {
    return null
  }

  return (
    <span
      data-slot="toast-icon"
      className="shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"
    >
      {icon}
    </span>
  )
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()

  return toasts.map((toastItem) => (
    <Toast key={toastItem.id} toast={toastItem}>
      <ToastContent>
        <ToastIcon type={toastItem.type} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ToastTitle />
          <ToastDescription />
        </div>
        <ToastAction />
        <ToastClose />
      </ToastContent>
    </Toast>
  ))
}

function Toaster({
  children,
  toastManager = toast,
  ...props
}: ToastPrimitive.Provider.Props) {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  )
}

const createToastManager = ToastPrimitive.createToastManager
const useToastManager = ToastPrimitive.useToastManager

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
}
