import { UnauthorizedError } from 'routing-controllers';

export class WrongPasswordError extends UnauthorizedError {
  constructor() {
    super('Wrong password!');
  }
}
