import { Test, TestingModule } from '@nestjs/testing';

import { ConfigModule } from '../config/config.module';
import { CryptService } from './crypt.service';
import { LoggerModule } from '../logger/logger.module';

describe('CryptService', () => {
  let service: CryptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, LoggerModule],
      providers: [CryptService],
    }).compile();

    service = module.get<CryptService>(CryptService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
