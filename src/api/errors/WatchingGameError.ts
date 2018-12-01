import { BadRequestError } from 'routing-controllers';

export class WatchingGameError extends BadRequestError {
  constructor(message) {
    super(`Error watching game: ${message}`);
  }
}
