import * as jwt from 'jsonwebtoken';
import { Injectable } from '@nestjs/common';

import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';
import { IJwtToken } from './jwt-token.interface';

@Injectable()
export class JwtService {
  private readonly JWT_SECRET = ConfigService.get().JWT_SECRET;

  constructor(private logger: LoggerService) {}

  public generateToken = (
    payload: IJwtToken,
    expIn: string,
    alg = 'HS256',
  ): string => {
    return jwt.sign(payload, this.JWT_SECRET, {
      algorithm: alg,
      expiresIn: expIn,
    });
  }

  public getUserIdByToken = (token: string): string => {
    let jwtDecoded: IJwtToken;

    try {
      jwtDecoded = jwt.verify(token, this.JWT_SECRET) as IJwtToken;
    } catch (err) {
      this.logger.warn(`Error verifying token: ${err.name}`);
      return null;
    }

    this.logger.info(`Token successfully decoded: ${jwtDecoded.id}`);

    return jwtDecoded.id;
  }
}
