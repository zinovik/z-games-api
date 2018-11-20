import * as jwt from 'jsonwebtoken';
import { Service } from 'typedi';

import { Logger, LoggerInterface } from '../../../decorators/Logger';
import { env } from '../../../env';

@Service()
export class JwtService {

  constructor(
    @Logger(__filename) private log: LoggerInterface
  ) { }

  public generateToken = (payload: object, expIn, alg = 'HS256'): string => {
    return jwt.sign(payload, env.app.jwtSecret, {
      algorithm: alg,
      expiresIn: expIn,
    });
  }

  public verifyAndDecodeToken = (token: string): string => {
    try {
      const jwtDecoded = jwt.verify(token, env.app.jwtSecret);

      this.log.info(`Token successfully decoded: ${(jwtDecoded as any).email}`);

      return (jwtDecoded as any).email;
    } catch (err) {
      this.log.warn(`Error verifying token: ${err.name}`);
      return undefined;
    }
  }

}
