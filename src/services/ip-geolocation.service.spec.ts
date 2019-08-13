import { Test, TestingModule } from '@nestjs/testing';

import { ConfigModule } from '../config/config.module';
import { IpGeolocationService } from './ip-geolocation.service';
import { ServicesModule } from './services.module';
import { LoggerModule } from '../logger/logger.module';

describe('NotificationService', () => {
  let service: IpGeolocationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, LoggerModule, ServicesModule],
      providers: [IpGeolocationService],
    }).compile();

    service = module.get<IpGeolocationService>(IpGeolocationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
