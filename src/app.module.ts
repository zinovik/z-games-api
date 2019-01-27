import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DbModule } from './db/db.module';
import { GameModule } from './game/game.module';
import { LogModule } from './log/log.module';
import { UserModule } from './user/user.module';
import { LoggerModule } from './logger/logger.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [
    ConfigModule,
    DbModule,
    GameModule,
    LogModule,
    UserModule,
    LoggerModule,
    ServicesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
