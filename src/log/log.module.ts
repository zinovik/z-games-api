import { Module } from '@nestjs/common';

import { UserModule } from './../user/user.module';
import { ServicesModule } from './../services/services.module';
import { LogGateway } from './log.gateway';
import { LogController } from './log.controller';
import { LogService } from './log.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [ServicesModule, LoggerModule, UserModule],
  controllers: [LogController],
  providers: [LogGateway, LogService],
  exports: [LogService],
})
export class LogModule { }
