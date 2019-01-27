import { Module } from '@nestjs/common';

import { ServicesModule } from './../services/services.module';
import { UserGateway } from './user.gateway';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [ServicesModule],
  controllers: [UserController],
  providers: [UserGateway, UserService],
})
export class UserModule { }
