import { Test, TestingModule } from '@nestjs/testing';

import { ConfigModule } from '../config/config.module';
import { ServicesModule } from '../services/services.module';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { UserGateway } from './user.gateway';
import { UserService } from './user.service';

describe('UserGateway', () => {
  let gateway: UserGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule,
        ServicesModule,
        DbModule,
        LoggerModule,
      ],
      providers: [UserGateway, UserService],
    }).compile();

    gateway = module.get<UserGateway>(UserGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
