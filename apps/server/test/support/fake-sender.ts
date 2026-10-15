import { User } from '@/generated/prisma/client';
import { MessengerMessage } from '@/messengers';

export interface SentMessage {
  userId: number;
  text: string;
}

/** Вместо отправки в мессенджер — копит сообщения, чтобы тест проверил, что и сколько раз ушло. */
export class FakeSender {
  public readonly sent: SentMessage[] = [];

  public async send(user: Pick<User, 'id'>, message: MessengerMessage) {
    this.sent.push({ userId: user.id, text: message.text });
    return true;
  }

  public to(userId: number): string[] {
    return this.sent.filter((m) => m.userId === userId).map((m) => m.text);
  }

  public clear(): void {
    this.sent.length = 0;
  }
}

