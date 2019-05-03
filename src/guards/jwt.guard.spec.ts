import { JwtGuard } from './jwt.guard';
import { JwtService } from '../services/jwt.service';
import { UserService } from '../user/user.service';
import { LoggerService } from '../logger/logger.service';

describe('JwtGuard', () => {
  /* tslint:disable */
  let jwtService: JwtService;
  let userService: UserService;
  let loggerService: LoggerService;
  /* tslint:enable */

  it('should be defined', () => {
    expect(new JwtGuard(jwtService, userService, loggerService)).toBeDefined();
  });
});
