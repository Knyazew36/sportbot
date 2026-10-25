import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { ThemeProvider } from 'next-themes'

import { type ReactNode, useState } from 'react'

import { registerWorkoutQueue } from '@sportbot/api/entities/workout'
import { getPersistOptions, queryClient, resumePersistedMutations } from '@/shared/api/query-client'
import { TooltipProvider } from '@/shared/ui/shadcn/animate-ui/components/animate/tooltip'
import { Toaster } from '@/shared/ui/shadcn/toast'

// До восстановления кеша: восстановленной из хранилища мутации нужен mutationFn
registerWorkoutQueue(queryClient)

const ServiceProvider = ({ children }: { children: ReactNode }) => {
  const [persistOptions] = useState(getPersistOptions)
  return (
    // attribute="class": тёмная тема в global.css завязана на класс .dark; обе темы поддерживаются на всех экранах
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      disableTransitionOnChange
    >
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={persistOptions}
        onSuccess={resumePersistedMutations}
      >
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </PersistQueryClientProvider>
    </ThemeProvider>
  )
}

export default ServiceProvider
