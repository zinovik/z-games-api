import { UnauthorizedError } from 'routing-controllers';

export class VerifyingTokenError extends UnauthorizedError {
  constructor() {
    super('Error verifying token!');
  }
}
