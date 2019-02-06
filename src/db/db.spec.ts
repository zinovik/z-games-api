import { Test, TestingModule } from '@nestjs/testing';
import { DbModule } from './db.module';

describe('Db', () => {
  let provider: DbModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DbModule],
    }).compile();

    provider = module.get<DbModule>(DbModule);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
