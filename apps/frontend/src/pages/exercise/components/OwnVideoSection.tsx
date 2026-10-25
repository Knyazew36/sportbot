import { ClapperboardIcon } from 'lucide-react'

import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// В самом низу: сначала само упражнение, плашка — для тех, кто его снимает
export const OwnVideoSection = ({ onOpen }: { onOpen: () => void }) => (
  <ScreenSection title='Своё видео'>
    <Text tone='soft'>Снимаешь это упражнение? Наложи на ролик плашку с названием и планом.</Text>
    <Button
      variant='outline'
      size='sm'
      className='self-start'
      onClick={onOpen}
    >
      <ClapperboardIcon />
      Плашка для вашего видео
    </Button>
  </ScreenSection>
)
