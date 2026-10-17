// Снимки внешних источников техники в prisma/content/sources/*.json: content:enrich берёт факты
// только оттуда, снимки лежат в git — видно, откуда взят каждый шаг.
// Запуск из apps/server: yarn content:sources [free-exercise-db wger]
/// <reference types="node" />
import 'dotenv/config';
import { fetchFreeExerciseDb } from './content-sources/free-exercise-db';
import { writeSnapshot } from './content-sources/snapshots';
import type { SourceRecord } from './content-sources/types';
import { fetchWger } from './content-sources/wger';

const ADAPTERS: Record<string, () => Promise<SourceRecord[]>> = {
  'free-exercise-db': fetchFreeExerciseDb,
  wger: fetchWger,
};

async function main() {
  const names = process.argv.slice(2);
  for (const name of names.length ? names : Object.keys(ADAPTERS)) {
    const adapter = ADAPTERS[name];
    if (!adapter) throw new Error(`Неизвестный источник: ${name}`);
    const records = await adapter();
    const file = writeSnapshot({
      source: name,
      fetchedAt: new Date().toISOString(),
      records,
    });
    console.log(`${name}: ${records.length} записей → ${file}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
