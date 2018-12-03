import { BadRequestError } from 'routing-controllers';

export class JoiningGameError extends BadRequestError {
  constructor(message: string) {
    super(`Error joining game: ${message}`);
  }
}
