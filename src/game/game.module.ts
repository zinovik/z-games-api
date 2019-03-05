import { Module } from '@nestjs/common';

import { ConfigModule } from '../config/config.module';
import { ServicesModule } from '../services/services.module';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { UserModule } from '../user/user.module';
import { LogModule } from '../log/log.module';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';

@Module({
  imports: [
    ConfigModule,
    ServicesModule,
    DbModule,
    LoggerModule,
    UserModule,
    LogModule,
  ],
  controllers: [GameController],
  providers: [GameGateway, GameService],
})
export class GameModule {}
