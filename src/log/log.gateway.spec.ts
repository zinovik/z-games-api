import { Test, TestingModule } from '@nestjs/testing';
import { LogGateway } from './log.gateway';

describe('LogGateway', () => {
  let gateway: LogGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LogGateway],
    }).compile();

    gateway = module.get<LogGateway>(LogGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
