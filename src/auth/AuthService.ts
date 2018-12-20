import * as express from 'express';
import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';

import { User } from '../api/models/User';
import { UserRepository } from '../api/repositories/UserRepository';
import {
  USER_FIELDS, USER_JOIN_CURRENT_GAMES, USER_JOIN_CURRENT_WATCH, USER_JOIN_OPENED_GAME
} from '../api/scopes';
import { JwtService } from '../api/services/jwt';
import { Logger, LoggerInterface } from '../decorators/Logger';

@Service()
export class AuthService {

  constructor(
    @Logger(__filename) private log: LoggerInterface,
    @OrmRepository() private userRepository: UserRepository,
    private jwtService: JwtService
  ) { }

  public async parseJwtFromRequest(req: express.Request): Promise<User> {
    const authorization = req.header('Authorization');

    if (!authorization || authorization.split(' ')[0] !== 'Bearer') {
      this.log.info('No credentials provided by the client');

      return undefined;
    }

    this.log.info('Credentials provided by the client');

    const token = authorization.split(' ')[1];

    return this.verifyAndDecodeJwt(token);
  }

  public async verifyAndDecodeJwt(token: string): Promise<User> {
    const username = this.jwtService.verifyAndDecodeToken(token);
    if (!username) {
      return undefined;
    }

    const user = await this.userRepository.createQueryBuilder('user')
      .select(USER_FIELDS)
      .leftJoin(...USER_JOIN_OPENED_GAME)
      .leftJoin(...USER_JOIN_CURRENT_GAMES)
      .leftJoin(...USER_JOIN_CURRENT_WATCH)
      .where({ username })
      .getOne();

    return user;
  }

}
