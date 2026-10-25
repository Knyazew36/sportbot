import type { StretchImageCreditResponseDto } from '@sportbot/api/generated/model'
import { Text } from '@/shared/ui/kit/Typography'

type ImageCreditProps = {
  credit: StretchImageCreditResponseDto | null
}

// Подпись под фото: CC BY и CC BY-SA обязывают указать автора, лицензию и источник
export const ImageCredit = ({ credit }: ImageCreditProps) => {
  if (!credit) return null
  const label = [credit.author, credit.license].filter(Boolean).join(' · ')
  return (
    <Text
      size='2xs'
      tone='muted'
    >
      Фото:{' '}
      {credit.source ? (
        <a
          href={credit.source}
          target='_blank'
          rel='noreferrer'
          className='underline underline-offset-2'
        >
          {label}
        </a>
      ) : (
        label
      )}
    </Text>
  )
}
