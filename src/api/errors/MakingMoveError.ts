import { BadRequestError } from 'routing-controllers';

export class MakingMoveError extends BadRequestError {
  constructor(message: string) {
    super(`Error making a move: ${message}`);
  }
}
