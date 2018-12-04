import { BadRequestError } from 'routing-controllers';

export class OpeningGameError extends BadRequestError {
  constructor(message: string) {
    super(`Error opening game: ${message}`);
  }
}
