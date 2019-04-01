import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';

import { ConfigService } from '../config/config.service';

@Injectable()
export class CryptService {
  private static readonly SALT_OR_ROUNDS = ConfigService.get().SALT_OR_ROUNDS;

  public static hashPassword(password: string): Promise<string> {

    return new Promise((resolve, reject) => {
      bcrypt.hash(password, this.SALT_OR_ROUNDS || 10, (err, hash) => {
        if (err) {
          return reject(err);
        }

        resolve(hash);
      });
    });

  }

  public static comparePassword(
    password: string,
    hashPassword: string,
  ): Promise<boolean> {

    return new Promise((resolve, reject) => {
      bcrypt.compare(password, hashPassword, (err, res) => {
        if (err) {
          return reject(err);
        }

        resolve(res === true);
      });
    });

  }

}
