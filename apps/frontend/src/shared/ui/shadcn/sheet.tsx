import * as React from "react"
import { Drawer as SheetPrimitive } from "@base-ui/react/drawer"
import { cn } from "@/shared/lib/utils"

import { Button } from "@/shared/ui/shadcn/animate-ui/components/buttons/button"
import { XIcon } from "lucide-react"

type SheetSide = "top" | "right" | "bottom" | "left"

// Шторка закрывается свайпом в ту сторону, откуда выехала
const SWIPE_DIRECTION = {
  top: "up",
  right: "right",
  bottom: "down",
  left: "left",
} as const satisfies Record<SheetSide, SheetPrimitive.Root.Props["swipeDirection"]>

const SheetSideContext = React.createContext<SheetSide>("bottom")

function Sheet({
  side = "bottom",
  ...props
}: Omit<SheetPrimitive.Root.Props, "swipeDirection"> & { side?: SheetSide }) {
  return (
    <SheetSideContext.Provider value={side}>
      <SheetPrimitive.Root
        data-slot="sheet"
        swipeDirection={SWIPE_DIRECTION[side]}
        {...props}
      />
    </SheetSideContext.Provider>
  )
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        // Затемнение светлеет вслед за пальцем, пока шторку тянут
        "fixed inset-0 z-50 bg-black/30 opacity-[calc(1-var(--drawer-swipe-progress,0))] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0 supports-backdrop-filter:backdrop-blur-glass",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  showCloseButton = true,
  fullHeight = false,
  ...props
}: SheetPrimitive.Popup.Props & {
  showCloseButton?: boolean
  /** Шторка с загрузкой данных сразу открывается на всю высоту — без скачка, когда данные подъедут */
  fullHeight?: boolean
}) {
  const side = React.useContext(SheetSideContext)

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Viewport
        data-slot="sheet-viewport"
        className="fixed inset-0 z-50"
      >
        <SheetPrimitive.Popup
          data-slot="sheet-content"
          data-side={side}
          className={cn(
            // Во время свайпа шторка идёт за пальцем без задержки, на отпускании доезжает с анимацией
            "fixed z-50 flex flex-col border-foreground/80 bg-popover bg-clip-padding text-sm text-popover-foreground outline-none transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform data-swiping:duration-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength,1)*300ms)]",
            // Потолок шторки — под кнопками Telegram (--sb-safe-top): на коротком экране 88svh заходит под его хедер
            "data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:mx-auto data-[side=bottom]:h-auto data-[side=bottom]:[--sheet-ceiling:calc(100svh-var(--sb-safe-top)-0.5rem)] data-[side=bottom]:max-h-[min(88svh,var(--sheet-ceiling))] data-[side=bottom]:max-w-[440px] data-[side=bottom]:border-t-2 data-[side=bottom]:pb-[var(--sb-bottom-inset)] data-[side=bottom]:transform-[translate3d(0,var(--drawer-swipe-movement-y,0px),0)] data-[side=bottom]:data-starting-style:transform-[translate3d(0,100%,0)] data-[side=bottom]:data-ending-style:transform-[translate3d(0,100%,0)]",
            "data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:rounded-b-card data-[side=top]:transform-[translate3d(0,var(--drawer-swipe-movement-y,0px),0)] data-[side=top]:data-starting-style:transform-[translate3d(0,-100%,0)] data-[side=top]:data-ending-style:transform-[translate3d(0,-100%,0)]",
            "data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:rounded-r-card data-[side=left]:sm:max-w-sm data-[side=left]:transform-[translate3d(var(--drawer-swipe-movement-x,0px),0,0)] data-[side=left]:data-starting-style:transform-[translate3d(-100%,0,0)] data-[side=left]:data-ending-style:transform-[translate3d(-100%,0,0)]",
            // h-full у fixed-шторки — высота экрана, max-h срезает её до потолка
            fullHeight && "data-[side=bottom]:h-full",
            "data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-full data-[side=right]:rounded-l-card data-[side=right]:sm:max-w-lg data-[side=right]:transform-[translate3d(var(--drawer-swipe-movement-x,0px),0,0)] data-[side=right]:data-starting-style:transform-[translate3d(100%,0,0)] data-[side=right]:data-ending-style:transform-[translate3d(100%,0,0)]",
            className
          )}
          {...props}
        >
          {side === "bottom" && (
            // Ручка подсказывает, что шторку можно смахнуть вниз; тянуть можно за любое место
            <div
              data-slot="sheet-handle"
              aria-hidden="true"
              className="absolute top-1.5 left-1/2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-muted-foreground/40"
            />
          )}
          {children}
          {showCloseButton && (
            <SheetPrimitive.Close
              data-slot="sheet-close"
              render={
                <Button
                  variant="outline"
                  className="absolute top-4 right-gutter"
                  size="icon-sm"
                />
              }
            >
              <XIcon
              />
              <span className="sr-only">Закрыть</span>
            </SheetPrimitive.Close>
          )}
        </SheetPrimitive.Popup>
      </SheetPrimitive.Viewport>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 px-gutter pt-5 pb-3 pr-16", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-3 px-gutter pt-3 pb-5", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "sb-poster text-[28px] text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-[14px] text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
