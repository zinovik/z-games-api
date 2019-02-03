import { Module } from '@nestjs/common';

import { LogModule } from '../log/log.module';
import { UserModule } from './../user/user.module';
import { ServicesModule } from './../services/services.module';
import { LoggerModule } from './../logger/logger.module';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';

@Module({
  imports: [LogModule, UserModule, ServicesModule, LoggerModule],
  controllers: [GameController],
  providers: [GameGateway, GameService],
})
export class GameModule { }
