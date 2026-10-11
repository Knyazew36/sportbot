import { randomBytes } from 'node:crypto';

/** Длинный непубличный токен для URL приглашения. */
export function generateInviteToken(): string {
  return randomBytes(32).toString('base64url');
}
