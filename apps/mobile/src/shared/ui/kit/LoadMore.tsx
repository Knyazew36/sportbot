import { Button } from './Button';

type LoadMoreProps = {
  query: { hasNextPage: boolean; isFetchingNextPage: boolean; fetchNextPage: () => Promise<unknown> };
};

// Следующая страница списка — порт shared/ui/kit/LoadMore.tsx: длинные выдачи грузятся порциями
export const LoadMore = ({ query }: LoadMoreProps) =>
  query.hasNextPage ? (
    <Button variant="outline" block loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()}>
      Показать ещё
    </Button>
  ) : null;
