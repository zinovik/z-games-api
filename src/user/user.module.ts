import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ConfigModule } from '../config/config.module';
import { ServicesModule } from '../services/services.module';
import { LoggerModule } from '../logger/logger.module';
import { UserController } from './user.controller';
import { UserGateway } from './user.gateway';
import { UserService } from './user.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { DbModule } from '../db/db.module';
import { userSchema } from '../db/schemas/user.schema';

@Module({
  imports: [
    ConfigModule,
    ServicesModule,
    LoggerModule,
    DbModule,
    MongooseModule.forFeature([{ name: 'User', schema: userSchema }]),
  ],
  controllers: [UserController],
  providers: [UserGateway, UserService, GoogleStrategy],
  exports: [UserService],
})
export class UserModule { }
