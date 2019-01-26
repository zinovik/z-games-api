import { Module } from '@nestjs/common';

import { UserGateway } from './user.gateway';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserGateway, UserService],
})
export class UserModule { }
