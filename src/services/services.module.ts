import { Module } from '@nestjs/common';

import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';
import { JwtService } from './jwt.service';
import { EmailService } from './email.service';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [JwtService, EmailService],
  exports: [JwtService, EmailService],
})
export class ServicesModule {}
