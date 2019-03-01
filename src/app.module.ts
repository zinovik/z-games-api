import { Module } from '@nestjs/common';

import { UserModule } from './user/user.module';
import { GameModule } from './game/game.module';
import { LogModule } from './log/log.module';
import { ConfigModule } from './config/config.module';
import { ServicesModule } from './services/services.module';
import { DbModule } from './db/db.module';
import { LoggerModule } from './logger/logger.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    UserModule,
    GameModule,
    LogModule,
    ConfigModule,
    ServicesModule,
    DbModule,
    LoggerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
