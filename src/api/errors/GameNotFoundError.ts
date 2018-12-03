import { HttpError } from 'routing-controllers';

export class GameNotFoundError extends HttpError {
  constructor() {
    super(404, 'Game not found!');
  }
}
