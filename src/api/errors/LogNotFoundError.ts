import { HttpError } from 'routing-controllers';

export class LogNotFoundError extends HttpError {
  constructor() {
    super(404, 'Log not found!');
  }
}
