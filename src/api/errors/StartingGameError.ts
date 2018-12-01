import { BadRequestError } from 'routing-controllers';

export class StartingGameError extends BadRequestError {
  constructor(message) {
    super(`Error starting game: ${message}`);
  }
}
