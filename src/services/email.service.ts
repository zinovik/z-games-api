import * as nodemailer from 'nodemailer';
import * as pug from 'pug';
import { Injectable } from '@nestjs/common';

import { ConfigService } from '../config/config.service';
import { JwtService } from './jwt.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class EmailService {

  private server: any;

  constructor(
    private jwtService: JwtService,
    private logger: LoggerService,
  ) {
    this.server = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: ConfigService.get().EMAIL_USER,
        pass: ConfigService.get().EMAIL_PASS,
      },
    });
  }

  public sendRegistrationMail({ id, email }: { id: string, email: string }): Promise<any> {
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

}
