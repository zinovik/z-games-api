import { Module } from '@nestjs/common';

import { ConfigModule } from '../config/config.module';
import { LoggerModule } from '../logger/logger.module';
import { JwtService } from './jwt.service';
import { EmailService } from './email.service';
import { CryptService } from './crypt.service';
import { SocketService } from './socket.service';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [JwtService, EmailService, CryptService, SocketService],
  exports: [JwtService, EmailService, CryptService, SocketService],
})
export class ServicesModule {}
