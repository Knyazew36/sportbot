import * as fs from 'fs';
import * as path from 'path';

import type { SourceSnapshot } from './types';

export const SOURCES_DIR = path.join(__dirname, '..', 'content', 'sources');

export function readSnapshot(source: string): SourceSnapshot | null {
  const file = path.join(SOURCES_DIR, `${source}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as SourceSnapshot;
}

export function writeSnapshot(snapshot: SourceSnapshot): string {
  fs.mkdirSync(SOURCES_DIR, { recursive: true });
  const file = path.join(SOURCES_DIR, `${snapshot.source}.json`);
  fs.writeFileSync(file, `${JSON.stringify(snapshot, null, 2)}\n`);
  return file;
}
