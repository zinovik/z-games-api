import { Module } from '@nestjs/common';
import { forwardRef} from '@nestjs/common';

import { ServicesModule } from '../services/services.module';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { UserModule } from '../user/user.module';
import { GameModule } from '../game/game.module';
import { LogGateway } from './log.gateway';
import { LogController } from './log.controller';
import { LogService } from './log.service';

@Module({
  imports: [
    DbModule,
    ServicesModule,
    LoggerModule,
    UserModule,
    forwardRef(() => GameModule),
  ],
  controllers: [LogController],
  providers: [LogGateway, LogService],
  exports: [LogService],
})
export class LogModule { }
