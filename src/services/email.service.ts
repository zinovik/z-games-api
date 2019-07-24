import * as nodemailer from 'nodemailer';
import * as pug from 'pug';
import { Injectable } from '@nestjs/common';

import { ConfigService } from '../config/config.service';
import { JwtService } from './jwt.service';
import { LoggerService } from '../logger/logger.service';

export interface ISendGridResult {
  accepted: string[];
  rejected: string[];
  envelopeTime: number;
  messageTime: number;
  messageSize: number;
  response: string;
  envelope: {
    from: string;
    to: string[];
  };
  messageId: string;
}

@Injectable()
export class EmailService {
  private server: any;

  constructor(private jwtService: JwtService, private logger: LoggerService) {
    this.server = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: ConfigService.get().EMAIL_USER,
        pass: ConfigService.get().EMAIL_PASS,
      },
    });
  }

  public sendRegistrationMail({ id, email }: { id: string; email: string }): Promise<ISendGridResult> {
    this.logger.info('Sending Registration Mail');

    const token = this.jwtService.generateToken({ id }, '2 hours');
    const link = `${ConfigService.get().CLIENT_URL}/activate/${token}`;

    const templatePath = __dirname + '/email-templates/registration.pug';

    return this.server.sendMail({
      text: '',
      from: '"Z-Games" <zinovik@gmail.com>',
      to: email,
      subject: 'Confirm your email in z-games',
      html: pug.renderFile(templatePath, { link, additionalText: '' }),
    });
  }

  public sendMoveMail({ gameNumber, email }: { gameNumber: number; email: string }): Promise<ISendGridResult> {
    this.logger.info('Sending Move Mail');

    const link = `${ConfigService.get().CLIENT_URL}/game/${gameNumber}`;

    const templatePath = __dirname + '/email-templates/move.pug';

    return this.server.sendMail({
      text: '',
      from: '"Z-Games" <zinovik@gmail.com>',
      to: email,
      subject: `Your move in the game number ${gameNumber}`,
      html: pug.renderFile(templatePath, { link, additionalText: '' }),
    });
  }

  public sendInviteMail({ gameNumber, email }: { gameNumber: number; email: string }): Promise<ISendGridResult> {
    this.logger.info('Sending Invite Mail');

    const link = `${ConfigService.get().CLIENT_URL}`;

    const templatePath = __dirname + '/email-templates/invite.pug';

    return this.server.sendMail({
      text: '',
      from: '"Z-Games" <zinovik@gmail.com>',
      to: email,
      subject: `You was invite to the game number ${gameNumber}`,
      html: pug.renderFile(templatePath, { link, additionalText: '' }),
    });
  }
}
