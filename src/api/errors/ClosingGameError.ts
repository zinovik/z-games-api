import { BadRequestError } from 'routing-controllers';

export class ClosingGameError extends BadRequestError {
  constructor(message: string) {
    super(`Error closing game: ${message}`);
  }
}
