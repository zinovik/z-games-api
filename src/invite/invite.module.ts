import { Module } from '@nestjs/common';

import { ServicesModule } from '../services/services.module';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { UserModule } from '../user/user.module';
import { InviteGateway } from './invite.gateway';
import { InviteController } from './invite.controller';
import { InviteService } from './invite.service';

@Module({
  imports: [ServicesModule, DbModule, LoggerModule, UserModule],
  controllers: [InviteController],
  providers: [InviteGateway, InviteService],
  exports: [InviteService],
})
export class InviteModule {}
