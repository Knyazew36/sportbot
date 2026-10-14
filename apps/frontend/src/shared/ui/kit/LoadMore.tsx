import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type LoadMoreProps = {
  query: { hasNextPage: boolean; isFetchingNextPage: boolean; fetchNextPage: () => Promise<unknown> }
}

// Следующая страница списка: длинные выдачи грузятся порциями по мере надобности
export const LoadMore = ({ query }: LoadMoreProps) =>
  query.hasNextPage ? (
    <Button
      variant='outline'
      className='w-full'
      disabled={query.isFetchingNextPage}
      onClick={() => void query.fetchNextPage()}
    >
      Показать ещё
    </Button>
  ) : null
