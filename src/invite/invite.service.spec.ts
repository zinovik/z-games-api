import { Test, TestingModule } from '@nestjs/testing';

import { ServicesModule } from '../services/services.module';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { UserModule } from '../user/user.module';
import { InviteGateway } from './invite.gateway';
import { InviteService } from './invite.service';

describe('InviteService', () => {
  let service: InviteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ServicesModule, DbModule, LoggerModule, UserModule],
      providers: [InviteGateway, InviteService],
    }).compile();

    service = module.get<InviteService>(InviteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
