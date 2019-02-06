import { BadRequestException } from '@nestjs/common';

export class MakingMoveError extends BadRequestException {
  constructor(message: string) {
    super(`Error making move: ${message}`);
  }
}
