import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DbModule } from './db/db.module';
import { GameModule } from './game/game.module';
import { LogModule } from './log/log.module';
import { UserModule } from './user/user.module';
import { AppGateway } from './app.gateway';

@Module({
  imports: [
    ConfigModule,
    DbModule,
    GameModule,
    LogModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppGateway],
})
export class AppModule { }
