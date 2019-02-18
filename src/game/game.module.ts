import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LogModule } from '../log/log.module';
import { UserModule } from './../user/user.module';
import { ServicesModule } from './../services/services.module';
import { ConfigModule } from '../config/config.module';
import { LoggerModule } from './../logger/logger.module';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { gameSchema } from 'src/db/models/game.model';

@Module({
  imports: [
    ConfigModule,
    LogModule,
    UserModule,
    ServicesModule,
    LoggerModule,
    MongooseModule.forFeature([{ name: 'Game', schema: gameSchema }]),
  ],
  controllers: [GameController],
  providers: [GameGateway, GameService],
})
export class GameModule { }
