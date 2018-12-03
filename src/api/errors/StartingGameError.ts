import { BadRequestError } from 'routing-controllers';

export class StartingGameError extends BadRequestError {
  constructor(message: string) {
    super(`Error starting game: ${message}`);
  }
}
