import { BadRequestError } from 'routing-controllers';

export class WatchingGameError extends BadRequestError {
  constructor(message: string) {
    super(`Error watching game: ${message}`);
  }
}
