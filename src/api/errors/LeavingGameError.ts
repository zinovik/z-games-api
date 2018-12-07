import { BadRequestError } from 'routing-controllers';

export class LeavingGameError extends BadRequestError {
  constructor(message: string) {
    super(`Error leaving game: ${message}`);
  }
}
