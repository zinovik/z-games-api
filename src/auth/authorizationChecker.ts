import { Action } from 'routing-controllers';
import { Container } from 'typedi';
import { Connection } from 'typeorm';

import { Logger } from '../lib/logger';
import { AuthService } from './AuthService';

export function authorizationChecker(connection: Connection): (action: Action, roles: any[]) => Promise<boolean> | boolean {
  const log = new Logger(__filename);
  const authService = Container.get<AuthService>(AuthService);

  return async function innerAuthorizationChecker(action: Action, roles: string[]): Promise<boolean> {

    const user = await authService.parseJwtFromRequest(action.request);

    if (!user) {
      log.warn('Invalid credentials given');

      return false;
    }

    log.info('Successfully checked credentials');
    return true;
  };

}
