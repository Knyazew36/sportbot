import { BadRequestException, Injectable } from '@nestjs/common';

import { BotChannelKey } from '@/bot';

import { LinkCodeResponseDto } from './dto/link-code.response.dto';
import { LinkStateResponseDto } from './dto/link-state.response.dto';
import { LinkService } from './link.service';

/** Мессенджеры в профиле Mini App (frontend-tz, 13.7): привязка по коду, отвязка, куда писать. */
@Injectable()
export class LinkAppService {
  constructor(private readonly links: LinkService) {}

  public async state(userId: number): Promise<LinkStateResponseDto> {
    const state = await this.links.state(userId);
    return { ...state, available: this.links.available() };
  }

  public createCode(userId: number): Promise<LinkCodeResponseDto> {
    return this.links.codeLink(userId);
  }

  public async unlink(
    userId: number,
    channel: BotChannelKey,
  ): Promise<LinkStateResponseDto> {
    await this.links.unlink(userId, channel);
    return this.state(userId);
  }

  public async notify(
    userId: number,
    channels: BotChannelKey[],
  ): Promise<LinkStateResponseDto> {
    const { linked } = await this.links.state(userId);
    if (channels.some((c) => !linked.includes(c)))
      throw new BadRequestException('Этот мессенджер не привязан.');
    await this.links.setNotifyChannels(userId, channels);
    return this.state(userId);
  }
}
