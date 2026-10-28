import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Library, Plus } from 'lucide-react-native';

import { complexLetter } from '@sportbot/api/entities/program';
import { useAddComplex } from '@/shared/local/entities/program';

import { routeHref, ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Icon } from '@/shared/ui/kit/Icon';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { Ticket } from '@/shared/ui/kit/Ticket';
import { Text } from '@/shared/ui/kit/Typography';

type AddComplexTicketProps = {
  programId: number;
  count: number;
};

export const AddComplexTicket = ({ programId, count }: AddComplexTicketProps) => {
  const [open, setOpen] = useState(false);
  const add = useAddComplex();

  const addBlank = () =>
    add.mutate(
      { programId, name: `Тренировка ${complexLetter(count)}` },
      {
        onSuccess: (program) => {
          const created = program.complexes.at(-1);
          if (created) {
            setOpen(false);
            router.push(routeHref(ROUTES.PROGRAM_COMPLEX, { programId, complexId: created.id }));
          }
        },
      },
    );

  return (
    <>
      <Ticket
        kicker="Добавить"
        mark={<Icon as={Plus} strokeWidth={2.5} className="size-8" />}
        title="Новая тренировка"
        onPress={() => setOpen(true)}
      />
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Новая тренировка"
        description="Встанет в конец очереди"
        footer={
          <View className="gap-2">
            <Button size="lg" block icon={Plus} loading={add.isPending} onPress={addBlank}>
              Собрать с нуля
            </Button>
            <ButtonLink
              href={ROUTES.PROGRAM_TEMPLATES}
              variant="outline"
              size="lg"
              block
              icon={Library}
              onNavigate={() => setOpen(false)}
            >
              Из каталога программ
            </ButtonLink>
          </View>
        }
      >
        <Text tone="soft">
          Собери с нуля или возьми готовую: открой программу в каталоге, нажми на билет тренировки — «Скопировать к
          себе».
        </Text>
      </Sheet>
    </>
  );
};
