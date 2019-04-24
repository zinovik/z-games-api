import { Test, TestingModule } from '@nestjs/testing';

import { ConfigModule } from '../config/config.module';
import { SocketService } from './socket.service';
import { LoggerModule } from '../logger/logger.module';

describe('SocketServiceService', () => {
  let service: SocketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, LoggerModule],
      providers: [SocketService],
    }).compile();

    service = module.get<SocketService>(SocketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
