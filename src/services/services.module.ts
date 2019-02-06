import { Module } from '@nestjs/common';

import { ConfigModule } from '../config/config.module';
import { JwtService } from './jwt.service';
import { LoggerModule } from './../logger/logger.module';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [JwtService],
  exports: [JwtService],
})
export class ServicesModule { }
