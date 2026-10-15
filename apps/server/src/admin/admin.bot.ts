import { Injectable } from '@nestjs/common';

import {
  BACK_TO_MENU,
  BotContext,
  BotFeature,
  BotHandler,
  BotSessionService,
  btn,
  cut,
  isAdmin,
  msg,
  hint,
} from '@/bot';
import { MessengerButton, MessengerMessage } from '@/messengers';

import { AdminService } from './admin.service';
import { ImportService } from './import.service';

const BACK = [btn('⬅️ Админ', 'ad:menu')];
/** Файл импорта — текст; больше этого точно ошибка. */
const IMPORT_MAX_BYTES = 2 * 1024 * 1024;

/** Админ-меню (`ad`) и разбор жалоб (`cp`) — только для администратора. */
@Injectable()
@BotHandler({ prefixes: ['ad', 'cp'], commands: ['admin'], admin: true })
export class AdminBot implements BotFeature {
  constructor(
    private readonly admin: AdminService,
    private readonly imports: ImportService,
    private readonly sessions: BotSessionService,
  ) {}

  public async onCommand(ctx: BotContext): Promise<void> {
    await ctx.reply(await this.menu());
  }

  public async onCallback(
    ctx: BotContext,
    prefix: string,
    action: string,
    args: string[],
  ): Promise<void> {
    const id = Number(args[0]);
    await this.sessions.clear(ctx);

    if (prefix === 'cp') {
      if (action === 'ok' || action === 'no') {
        const closed = await this.admin.closeComplaint(
          id,
          action === 'ok' ? 'RESOLVED' : 'REJECTED',
        );
        await ctx.toast(closed ? 'Жалоба закрыта' : 'Жалоба уже обработана');
      }
      return ctx.edit(await this.complaintsScreen());
    }

    switch (action) {
      case 'menu':
        return ctx.edit(await this.menu());
      case 'imp':
        return ctx.edit(
          msg(
            'Импорт справочника и шаблонов. Пришли мне JSON-файл с полями exercises, stretches, programTagGroups, programTags, programs — проверю его и покажу отчёт. Запись в базу — только после кнопки «Применить».\n\nЗапись ищется по code: есть — обновлю, нет — создам. Удаления импортом нет.',
            [BACK],
          ),
        );
      case 'apply': {
        const raw = this.imports.loadPending(ctx.user.id);
        if (!raw) return ctx.toast('Файла нет — пришли его заново');
        const report = await this.imports.apply(raw);
        this.imports.dropPending(ctx.user.id);
        return ctx.edit(
          msg(
            `Импорт применён. Создано: ${report.create}, обновлено: ${report.update}.`,
            [BACK],
          ),
        );
      }
      case 'blk':
        await this.sessions.set(ctx, 'ad.find');
        return ctx.edit(
          msg(`Кого ищем?\n${hint('Напиши имя или id пользователя.')}`, [BACK]),
        );
      case 'u':
        return ctx.edit(await this.userScreen(id));
      case 'ban':
        if (id === ctx.user.id) return ctx.toast('Себя заблокировать нельзя');
        await this.admin.block(id);
        await ctx.toast('Заблокирован');
        return ctx.edit(await this.userScreen(id));
      case 'unban':
        await this.admin.unblock(id);
        await ctx.toast('Разблокирован');
        return ctx.edit(await this.userScreen(id));
      default:
        return ctx.toast('Кнопка устарела');
    }
  }

  public async onText(ctx: BotContext): Promise<void> {
    const users = await this.admin.findUsers(ctx.text ?? '');
    await ctx.reply(
      users.length
        ? msg('Нашёл:', [
            ...users.map((u) => [
              btn(
                cut(
                  `#${u.id} ${u.sportProfile?.displayName ?? u.name ?? 'без имени'}`,
                ),
                `ad:u:${u.id}`,
              ),
            ]),
            BACK,
          ])
        : msg('Никого не нашёл. Попробуй другое имя или id.', [BACK]),
    );
  }

  /** JSON-файл импорта: проверка всего файла и отчёт, запись — после «Применить». */
  public async onDocument(ctx: BotContext): Promise<void> {
    const document = ctx.document!;
    if (!document.fileName.toLowerCase().endsWith('.json')) {
      await ctx.reply(msg('Жду JSON-файл импорта (.json).', [BACK]));
      return;
    }
    if (document.size > IMPORT_MAX_BYTES) {
      await ctx.reply(msg('Файл слишком большой для импорта.', [BACK]));
      return;
    }
    const raw = (await document.download()).toString('utf-8');
    const { report } = await this.imports.check(raw);
    const buttons: MessengerButton[][] = [];
    if (!report.errors.length) {
      this.imports.savePending(ctx.user.id, raw);
      buttons.push([btn('✅ Применить', 'ad:apply')]);
    }
    buttons.push(BACK);
    await ctx.reply(
      msg(
        `${this.imports.reportText(report)}${report.errors.length ? '\n\nИсправь ошибки и пришли файл заново.' : ''}`,
        buttons,
      ),
    );
  }

  // ── Экраны ──────────────────────────────────────────────────────────────

  private async menu(): Promise<MessengerMessage> {
    const c = await this.admin.counters();
    return msg(
      [
        'Админ-меню',
        '',
        `Пользователей: ${c.users}`,
        `Тренировок за неделю: ${c.workouts}`,
        `В справочнике: упражнений — ${c.exercises}, растяжек — ${c.stretches}`,
        `Заявок на проверке: ${c.requests}`,
        `Открытых жалоб: ${c.complaints}`,
      ].join('\n'),
      [
        [
          btn(`🛡 Заявки (${c.requests})`, 'md:list'),
          btn(`✏️ Жалобы (${c.complaints})`, 'cp:list'),
        ],
        [btn('📥 Импорт', 'ad:imp'), btn('🚫 Блокировка', 'ad:blk')],
        [BACK_TO_MENU],
      ],
    );
  }

  private async complaintsScreen(): Promise<MessengerMessage> {
    const complaints = await this.admin.openComplaints();
    if (!complaints.length) return msg('Открытых жалоб нет.', [BACK]);
    return msg(
      [
        'Открытые жалобы на описание. Саму запись правь импортом.',
        ...complaints.map(
          (c, index) =>
            `${index + 1}. «${c.exercise?.name ?? c.stretch?.name}» от ${c.user?.sportProfile?.displayName ?? 'удалённого пользователя'}:\n${c.text}`,
        ),
      ].join('\n\n'),
      [
        ...complaints.map((c, index) => [
          btn(`✅ ${index + 1} исправлено`, `cp:ok:${c.id}`),
          btn(`❌ ${index + 1} отклонить`, `cp:no:${c.id}`),
        ]),
        BACK,
      ],
    );
  }

  private async userScreen(userId: number): Promise<MessengerMessage> {
    const { user, blocked } = await this.admin.userCard(userId);
    return msg(
      [
        `#${user.id} ${user.sportProfile?.displayName ?? user.name ?? 'без имени'}`,
        `Telegram: ${user.telegramId ?? '—'}, MAX: ${user.maxId ?? '—'}`,
        `Статус: ${blocked ? '🚫 заблокирован' : 'активен'}${isAdmin(user) ? ' · администратор' : ''}`,
      ].join('\n'),
      [
        [
          blocked
            ? btn('Разблокировать', `ad:unban:${user.id}`)
            : btn('🚫 Заблокировать', `ad:ban:${user.id}`),
        ],
        BACK,
      ],
    );
  }
}
