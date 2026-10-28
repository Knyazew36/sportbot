// Пресет Expo как без этого файла; добавлен только inline-import: миграции drizzle — .sql-файлы,
// в бандл они попадают строками (src/shared/db/migrations)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
