import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'

import type { ReactNode } from 'react'

import { queryClient } from '@/shared/api/query-client'
import { TooltipProvider } from '@/shared/ui/shadcn/animate-ui/components/animate/tooltip'
import { Toaster } from '@/shared/ui/shadcn/toast'

const ServiceProvider = ({ children }: { children: ReactNode }) => {
  return (
    // attribute="class": тёмная тема в global.css завязана на класс .dark; обе темы поддерживаются на всех экранах
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default ServiceProvider
