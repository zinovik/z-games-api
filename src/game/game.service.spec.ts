import { Test, TestingModule } from '@nestjs/testing';

import { ConfigModule } from '../config/config.module';
import { ServicesModule } from '../services/services.module';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { UserModule } from '../user/user.module';
import { LogModule } from '../log/log.module';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { InviteModule } from '../invite/invite.module';

describe('GameService', () => {
  let service: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, DbModule, ServicesModule, LoggerModule, UserModule, LogModule, InviteModule],
      providers: [GameGateway, GameService],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
