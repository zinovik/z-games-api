import { Test, TestingModule } from '@nestjs/testing';

import { ServicesModule } from '../services/services.module';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { UserModule } from '../user/user.module';
import { GameModule } from '../game/game.module';
import { LogGateway } from './log.gateway';
import { LogService } from './log.service';

describe('LogService', () => {
  let service: LogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ServicesModule, DbModule, LoggerModule, UserModule, GameModule],
      providers: [LogGateway, LogService],
    }).compile();

    service = module.get<LogService>(LogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
