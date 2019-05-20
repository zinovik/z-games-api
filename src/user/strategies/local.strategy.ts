import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

import { UserService } from '../user.service';
import { CryptService } from '../../services/crypt.service';
import { AuthorizationUserException } from '../../exceptions';
import { User } from '../../db/entities';
import { IUser } from '../../db/interfaces';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
  ) {
    super({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: false,
    });
  }

  async validate(username: string, password: string): Promise<User | IUser> {
    const user = await this.userService.findOneByUsername(username);

    if (!user) {
      throw new AuthorizationUserException('Invalid username!');
    }

    if (!await CryptService.comparePassword(password, user.password)) {
      throw new AuthorizationUserException('Invalid password!');
    }

    if (!user.isConfirmed) {
      throw new AuthorizationUserException('User is not activated! Check email to activate user');
    }

    return user;
  }
}
