import { Injectable } from '@nestjs/common';
import axios from 'axios';

import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';

const URL = 'https://api.ipgeolocation.io/ipgeo';

export interface IIpGeolocationResult {
  country_flag?: string;
}

@Injectable()
export class IpGeolocationService {
  constructor(private logger: LoggerService) {}

  public async getFlag({ ip }: { ip: string }): Promise<string | undefined> {
    this.logger.info(`Get country flag for ip: ${ip}`);

    const IP_GEOLOCATION_API_KEY = ConfigService.get().IP_GEOLOCATION_API_KEY;

    console.log(123, IP_GEOLOCATION_API_KEY);
    console.log(222, ConfigService.get());

    try {
      const { data: response }: { data: IIpGeolocationResult } = await axios.get(
        `${URL}?apiKey${IP_GEOLOCATION_API_KEY}=&ip=${ip}`,
      );

      return response.country_flag;
    } catch (error) {
      console.log(error.response.data);
      throw new Error();
    }
  }
}
