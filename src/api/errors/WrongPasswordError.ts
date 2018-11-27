import { HttpError } from 'routing-controllers';

export class WrongPasswordError extends HttpError {
  constructor() {
    super(404, 'Wrong password!');
  }
}
