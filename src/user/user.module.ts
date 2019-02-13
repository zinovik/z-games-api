import { Module } from '@nestjs/common';

import { ConfigModule } from '../config/config.module';
import { ServicesModule } from './../services/services.module';
import { LoggerModule } from '../logger/logger.module';
import { UserController } from './user.controller';
import { UserGateway } from './user.gateway';
import { UserService } from './user.service';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    ConfigModule,
    ServicesModule,
    LoggerModule,
  ],
  controllers: [UserController],
  providers: [UserGateway, UserService, GoogleStrategy],
  exports: [UserService],
})
export class UserModule { }
