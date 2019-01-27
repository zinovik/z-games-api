import * as jwt from 'jsonwebtoken';
import { Injectable } from '@nestjs/common';

import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class JwtService {

  private readonly JWT_SECRET = ConfigService.get().JWT_SECRET;

  constructor(private logger: LoggerService) { }

  public generateToken = (payload: object, expIn, alg = 'HS256'): string => {
    return jwt.sign(payload, this.JWT_SECRET, {
      algorithm: alg,
      expiresIn: expIn,
    });
  }

  public verifyAndDecodeToken = (token: string): string => {

    let jwtDecoded = {};

    try {
      jwtDecoded = jwt.verify(token, this.JWT_SECRET);
    } catch (err) {
      this.logger.warn(`Error verifying token: ${err.name}`);
      return undefined;
    }

    this.logger.info(`Token successfully decoded: ${(jwtDecoded as any).username}`);

    return (jwtDecoded as any).username;
  }

}
