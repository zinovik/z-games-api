import { Test, TestingModule } from '@nestjs/testing';

import { ServicesModule } from '../services/services.module';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { UserModule } from '../user/user.module';
import { InviteGateway } from './invite.gateway';
import { InviteService } from './invite.service';

describe('InviteGateway', () => {
  let gateway: InviteGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ServicesModule, DbModule, LoggerModule, UserModule],
      providers: [InviteGateway, InviteService],
    }).compile();

    gateway = module.get<InviteGateway>(InviteGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
