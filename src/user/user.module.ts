import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ConfigModule } from '../config/config.module';
import { ServicesModule } from './../services/services.module';
import { LoggerModule } from '../logger/logger.module';
import { UserController } from './user.controller';
import { UserGateway } from './user.gateway';
import { UserService } from './user.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { UserSchema } from '../db/schemas/user.schema';
import { ConfigService } from '../config/config.service';

const additionalModules = [];
if (ConfigService.get().USE_MONGO === 'true') {
  additionalModules.push(MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]));
}

@Module({
  imports: [ConfigModule, ServicesModule, LoggerModule, ...additionalModules],
  controllers: [UserController],
  providers: [UserGateway, UserService, GoogleStrategy],
  exports: [UserService],
})
export class UserModule { }
