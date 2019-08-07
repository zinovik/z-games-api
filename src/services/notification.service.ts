import { Injectable } from '@nestjs/common';
import axios from 'axios';

import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';

const URL = 'https://fcm.googleapis.com/fcm/send';

export interface IFirebaseResult {
  multicast_id: number;
  success: number;
  failure: number;
  canonical_ids: number;
  results: [
    {
      message_id: string;
    },
  ];
}

@Injectable()
export class NotificationService {
  constructor(private logger: LoggerService) {}

  public async sendNotification({
    title,
    message,
    userToken,
  }: {
    title: string;
    message: string;
    userToken: string;
  }): Promise<IFirebaseResult> {
    this.logger.info('Sending Notification');

    const data = {
      notification: {
        title,
        body: message,
        click_action: ConfigService.get().CLIENT_URL,
        icon: `${ConfigService.get().CLIENT_URL}/favicon.ico`,
      },
      to: userToken,
    };

    const { data: response } = await axios.post(URL, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${ConfigService.get().FIREBASE_SERVER_KEY}`,
      },
    });

    return response;
  }

  public async sendMoveNotification({
    gameNumber,
    notificationsToken,
  }: {
    gameNumber: number;
    notificationsToken: string;
  }): Promise<IFirebaseResult> {
    this.logger.info('Sending Move Notification');

    const data = {
      notification: {
        title: 'Game Move',
        body: `Your move in the game number ${gameNumber}`,
        click_action: ConfigService.get().CLIENT_URL,
        icon: `${ConfigService.get().CLIENT_URL}/favicon.ico`,
      },
      to: notificationsToken,
    };

    const { data: response } = await axios.post(URL, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${ConfigService.get().FIREBASE_SERVER_KEY}`,
      },
    });

    return response;
  }

  public async sendInviteNotification({
    gameNumber,
    notificationsToken,
  }: {
    gameNumber: number;
    notificationsToken: string;
  }): Promise<IFirebaseResult> {
    this.logger.info('Sending Invite Notification');

    const data = {
      notification: {
        title: 'Game Invite',
        body: `You was invite to the game number ${gameNumber}`,
        click_action: ConfigService.get().CLIENT_URL,
        icon: `${ConfigService.get().CLIENT_URL}/favicon.ico`,
      },
      to: notificationsToken,
    };

    const { data: response } = await axios.post(URL, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${ConfigService.get().FIREBASE_SERVER_KEY}`,
      },
    });

    return response;
  }
}
