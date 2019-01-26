import { Test, TestingModule } from '@nestjs/testing';
import { Db } from './db';

describe('Db', () => {
  let provider: Db;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Db],
    }).compile();

    provider = module.get<Db>(Db);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
