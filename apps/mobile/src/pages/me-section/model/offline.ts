import type { SyncPhase } from '@/shared/sync';
import type { SyncIssue } from '@/shared/sync/apply-push';

export const SYNC_PHASE_LABEL: Record<SyncPhase, string> = {
  idle: 'синхронизировано',
  syncing: 'синхронизация…',
  offline: 'нет связи с сервером',
  'signed-out': 'нужен вход',
  error: 'ошибка',
};

/** Сколько отказов сервера показать в плашке */
export const ISSUES_SHOWN = 3;

export const parseIssues = (raw: string | undefined): SyncIssue[] => {
  try {
    return raw ? (JSON.parse(raw) as SyncIssue[]) : [];
  } catch {
    return [];
  }
};
