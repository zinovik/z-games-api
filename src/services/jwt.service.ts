import * as jwt from 'jsonwebtoken';
import { Injectable } from '@nestjs/common';

import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logger/logger.service';

interface TokenDecoded {
  username: string;
}

@Injectable()
export class JwtService {

  private readonly JWT_SECRET = ConfigService.get().JWT_SECRET;

  constructor(private logger: LoggerService) { }

  public generateToken = (payload: TokenDecoded, expIn: string, alg = 'HS256'): string => {
    return jwt.sign(payload, this.JWT_SECRET, {
      algorithm: alg,
      expiresIn: expIn,
    });
  }

  public getUserNameByToken = (token: string): string => {

    let jwtDecoded: TokenDecoded;

    try {
      jwtDecoded = jwt.verify(token, this.JWT_SECRET) as TokenDecoded;
    } catch (err) {
      this.logger.warn(`Error verifying token: ${err.name}`);
      return null;
    }

    this.logger.info(`Token successfully decoded: ${(jwtDecoded as any).username}`);

    return jwtDecoded.username;
  }

}
