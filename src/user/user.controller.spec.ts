import { Test, TestingModule } from '@nestjs/testing';

import { ConfigModule } from '../config/config.module';
import { ServicesModule } from '../services/services.module';
import { DbModule } from '../db/db.module';
import { LoggerModule } from '../logger/logger.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { GoogleStrategy } from './strategies/google.strategy';

describe('User Controller', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, ServicesModule, DbModule, LoggerModule],
      controllers: [UserController],
      providers: [UserService, GoogleStrategy],
      exports: [UserService],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
