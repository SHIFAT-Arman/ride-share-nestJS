import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Pusher from 'pusher';

@Injectable()
export class PusherService {
  private pusher: Pusher;

  constructor(private config: ConfigService) {
    this.pusher = new Pusher({
      appId: this.config.getOrThrow<string>('PUSHER_APP_id'),
      key: this.config.getOrThrow<string>('PUSHER_APP_key'),
      secret: this.config.getOrThrow<string>('PUSHER_APP_secret'),
      cluster: this.config.getOrThrow<string>('PUSHER_APP_cluster'),
      useTLS: true,
    });
  }

  async trigger(channel: string, event: string, data: any) {
    await this.pusher.trigger(channel, event, data);
  }
}
