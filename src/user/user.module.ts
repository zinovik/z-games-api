import { Module } from '@nestjs/common';

import { ConfigModule } from '../config/config.module';
import { ServicesModule } from '../services/services.module';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { UserController } from './user.controller';
import { UserGateway } from './user.gateway';
import { UserService } from './user.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [ConfigModule, ServicesModule, DbModule, LoggerModule],
  controllers: [UserController],
  providers: [UserGateway, UserService, GoogleStrategy, LocalStrategy],
  exports: [UserService],
})
export class UserModule {}
