import * as nodemailer from 'nodemailer';
import * as pug from 'pug';
import { Injectable } from '@nestjs/common';

import { ConfigService } from '../config/config.service';
import { JwtService } from './jwt.service';
import { LoggerService } from '../logger/logger.service';
import { IEmailTemplateOptions } from './email-template-options.interface';
import { IEmailOptions } from './email-options.interface';

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

  private send({ to, subject, html }: IEmailOptions): Promise<any> {
    return this.server.sendMail({
      text: '',
      from: '"Z-Games" <zinovik@gmail.com>',
      to,
      subject,
      html,
    });
  }

  public sendRegistrationMail({ id, email }: { id: string, email: string }): Promise<any> {
    const token = this.jwtService.generateToken({ id }, '2 hours');
    const link = `${ConfigService.get().CLIENT_URL}/users/activate/${token}`;

    const templatePath = __dirname + '/email-templates/registration.pug';
    const templateOptions: IEmailTemplateOptions = { link, additionalText: '' };

    const options: IEmailOptions = {
      to: email,
      subject: 'Confirm your email in z-games',
      html: pug.renderFile(templatePath, templateOptions),
    };

    return this.send(options);
  }

}
