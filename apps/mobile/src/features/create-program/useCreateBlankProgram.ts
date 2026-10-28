import { router } from 'expo-router';

import { useCreateProgram } from '@/shared/local/entities/program';

import { routeHref, ROUTES } from '@/shared/config/routes';

const DEFAULT_NAME = 'Новая программа';

export const useCreateBlankProgram = () => {
  const create = useCreateProgram();

  return {
    create: () =>
      create
        .mutateAsync(DEFAULT_NAME)
        .then((program) => router.push(routeHref(ROUTES.PROGRAM, { programId: program.id }))),
    isPending: create.isPending,
  };
};
