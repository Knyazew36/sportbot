import type { SVGProps } from 'react'

// Несколько иконок inline: тянуть библиотеку иконок ради них в каждый проект незачем
const Icon = ({ children, ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox='0 0 24 24'
    width='20'
    height='20'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden
    {...props}
  >
    {children}
  </svg>
)

export const ChatIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d='M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z' />
  </Icon>
)

export const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d='M18 6 6 18M6 6l12 12' />
  </Icon>
)

export const SendIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d='M12 19V5M5 12l7-7 7 7' />
  </Icon>
)

export const PencilIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d='M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z' />
  </Icon>
)

export const ZapIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d='M13 2 4 14h7l-1 8 9-12h-7l1-8Z' />
  </Icon>
)

export const PaperclipIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d='m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5' />
  </Icon>
)

export const CheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d='M20 6 9 17l-5-5' />
  </Icon>
)

export const CheckCheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d='M18 6 7 17l-5-5M22 10l-7.5 7.5L13 16' />
  </Icon>
)

export const ClockIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle
      cx='12'
      cy='12'
      r='9'
    />
    <path d='M12 7v5l3 2' />
  </Icon>
)

export const AlertIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle
      cx='12'
      cy='12'
      r='9'
    />
    <path d='M12 8v4M12 16h.01' />
  </Icon>
)

export const ArrowLeftIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d='M19 12H5M12 19l-7-7 7-7' />
  </Icon>
)

export const HeadsetIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d='M3 14v-2a9 9 0 0 1 18 0v2' />
    <path d='M21 15a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2v2ZM3 15a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2v2Z' />
    <path d='M19 17v1a3 3 0 0 1-3 3h-3' />
  </Icon>
)

export const BotIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <rect
      x='4'
      y='8'
      width='16'
      height='12'
      rx='3'
    />
    <path d='M12 4v4M9 13h.01M15 13h.01M9 17h6' />
  </Icon>
)

export const ChevronLeftIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d='m15 18-6-6 6-6' />
  </Icon>
)

export const ChevronRightIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d='m9 18 6-6-6-6' />
  </Icon>
)

export const ExternalLinkIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d='M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' />
  </Icon>
)

export const ReplyIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d='M9 14 4 9l5-5' />
    <path d='M4 9h10.5a5.5 5.5 0 0 1 0 11H11' />
  </Icon>
)

export const SmileIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle
      cx='12'
      cy='12'
      r='9'
    />
    <path d='M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01' />
  </Icon>
)
