import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserModule } from './../user/user.module';
import { ServicesModule } from './../services/services.module';
import { LogGateway } from './log.gateway';
import { LogController } from './log.controller';
import { LogService } from './log.service';
import { LoggerModule } from '../logger/logger.module';
import { ConfigService } from '../config/config.service';
import { LogSchema } from '../db/schemas/log.schema';

const additionalModules = [];
if (ConfigService.get().USE_MONGO === 'true') {
  additionalModules.push(MongooseModule.forFeature([{ name: 'Log', schema: LogSchema }]));
}

@Module({
  imports: [ServicesModule, LoggerModule, UserModule, ...additionalModules],
  controllers: [LogController],
  providers: [LogGateway, LogService],
  exports: [LogService],
})
export class LogModule { }
