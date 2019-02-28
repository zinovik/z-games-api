import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserModule } from '../user/user.module';
import { ServicesModule } from '../services/services.module';
import { LogGateway } from './log.gateway';
import { LogController } from './log.controller';
import { LogService } from './log.service';
import { LoggerModule } from '../logger/logger.module';
import { logSchema } from '../db/schemas/log.schema';
import { userSchema } from '../db/schemas/user.schema';
import { gameSchema } from '../db/schemas/game.schema';

@Module({
  imports: [
    ServicesModule,
    LoggerModule,
    UserModule,
    MongooseModule.forFeature([{ name: 'Log', schema: logSchema }]),
    MongooseModule.forFeature([{ name: 'User', schema: userSchema }]),
    MongooseModule.forFeature([{ name: 'Game', schema: gameSchema }]),
  ],
  controllers: [LogController],
  providers: [LogGateway, LogService],
  exports: [LogService],
})
export class LogModule { }
