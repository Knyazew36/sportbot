import { Share } from 'react-native';
import { Share2 } from 'lucide-react-native';

import { useShareProgram } from '@sportbot/api/entities/program';

import { Button, type ButtonSize, type ButtonVariant } from '@/shared/ui/kit/Button';

type ShareProgramButtonProps = {
  programId: number;
  size?: ButtonSize;
  variant?: ButtonVariant;
  /** Короткая подпись, где рядом уже сказано, что делимся программой */
  label?: string;
  block?: boolean;
  className?: string;
};

const LABEL = 'Поделиться с другом';

// Ссылка ведёт только на программу — порт features/share-program: открывший видит состав и забирает копию себе,
// дружба не нужна. Ссылку отдаём системному «Поделиться» — он есть на любом телефоне, копировать не нужно
export const ShareProgramButton = ({
  programId,
  size,
  variant = 'share',
  label = LABEL,
  block,
  className,
}: ShareProgramButtonProps) => {
  const share = useShareProgram();
  return (
    <Button
      variant={variant}
      size={size}
      block={block}
      className={className}
      icon={Share2}
      loading={share.isPending}
      onPress={() =>
        share.mutate(programId, {
          onSuccess: (link) => void Share.share({ message: `${link.text}\n${link.url}`, url: link.url }),
        })
      }
    >
      {label}
    </Button>
  );
};
