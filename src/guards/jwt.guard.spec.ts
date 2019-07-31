import { JwtGuard } from './jwt.guard';
import { JwtService } from '../services/jwt.service';
import { UserService } from '../user/user.service';
import { LoggerService } from '../logger/logger.service';

describe('JwtGuard', () => {
  // tslint:disable-next-line:prefer-const
  let jwtService: JwtService;
  // tslint:disable-next-line:prefer-const
  let userService: UserService;
  // tslint:disable-next-line:prefer-const
  let loggerService: LoggerService;

  it('should be defined', () => {
    expect(new JwtGuard(jwtService, userService, loggerService)).toBeDefined();
  });
});
