// Миграции drizzle: babel inline-import превращает .sql в строку
declare module '*.sql' {
  const sql: string;
  export default sql;
}
