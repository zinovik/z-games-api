import { Module } from '@nestjs/common';

import { ServicesModule } from '../services/services.module';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { UserModule } from '../user/user.module';
import { LogGateway } from './log.gateway';
import { LogController } from './log.controller';
import { LogService } from './log.service';

@Module({
  imports: [ServicesModule, DbModule, LoggerModule, UserModule],
  controllers: [LogController],
  providers: [LogGateway, LogService],
  exports: [LogService],
})
export class LogModule {}
