import { Module } from '@nestjs/common';

import { GameGateway } from './game.gateway';
import { GameController } from './game.controller';
import { GameService } from './game.service';

@Module({
  controllers: [GameController],
  providers: [GameGateway, GameService],
})
export class GameModule { }
