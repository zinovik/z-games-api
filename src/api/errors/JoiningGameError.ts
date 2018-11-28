import { BadRequestError } from 'routing-controllers';

export class JoiningGameError extends BadRequestError {
  constructor(message) {
    super(`Error joining game: ${message}`);
  }
}
