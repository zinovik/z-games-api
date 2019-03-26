import { BadRequestException } from '@nestjs/common';

export class MakingMoveException extends BadRequestException {
  constructor(message: string) {
    super(`Error making move: ${message}`);
  }
}
