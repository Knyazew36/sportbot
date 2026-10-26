import { cloneElement, useState, type ReactElement, type ReactNode } from 'react';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './AlertDialog';
import { Button, type ButtonProps } from './Button';
import { Input } from './Input';

type ConfirmActionProps = {
  /** Кнопка-триггер, например <Button variant="destructive" block /> — подпись берётся из children */
  trigger: ReactElement<ButtonProps>;
  children: ReactNode;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  /** Слово, которое нужно ввести для подтверждения — для самых необратимых действий */
  confirmWord?: string;
  /** Необратимое удаление — красная кнопка; подтверждение обычного действия — синяя */
  confirmVariant?: 'destructive' | 'default';
  /** Окно закрывается, когда промис выполнится; при ошибке остаётся открытым */
  onConfirm: () => Promise<unknown> | void;
};

// Подтверждение необратимого действия — порт shared/ui/kit/ConfirmAction.tsx: удаление, отмена, пропуск
export const ConfirmAction = ({
  trigger,
  children,
  title,
  description,
  confirmLabel = 'Подтвердить',
  confirmWord,
  confirmVariant = 'destructive',
  onConfirm,
}: ConfirmActionProps) => {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [typed, setTyped] = useState('');
  const wordMatches = !confirmWord || typed.trim().toLowerCase() === confirmWord;

  const change = (next: boolean) => {
    setOpen(next);
    if (!next) setTyped('');
  };

  const confirm = async () => {
    setPending(true);
    try {
      await onConfirm();
      change(false);
    } catch {
      // Текст ошибки показывает общий тост мутации (shared/api/query-client)
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {cloneElement(trigger, { onPress: () => change(true), children })}
      {/* Корень диалога — пустой View рядом с триггером. В строке (шапка) он занимал место и добавлял gap
          справа от кнопки; absolute выводит его из раскладки, окно всё равно рисуется в портале */}
      <AlertDialog open={open} onOpenChange={change} className="absolute">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
          </AlertDialogHeader>
          {confirmWord ? (
            <Input
              value={typed}
              onChangeText={setTyped}
              placeholder={`Введите «${confirmWord}»`}
              accessibilityLabel={`Введите слово «${confirmWord}» для подтверждения`}
              autoCapitalize="none"
              autoCorrect={false}
            />
          ) : null}
          <AlertDialogFooter>
            <Button variant="outline" block onPress={() => change(false)}>
              Отмена
            </Button>
            <Button variant={confirmVariant} block loading={pending} disabled={!wordMatches} onPress={() => void confirm()}>
              {confirmLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
