import { BadRequestException } from '@nestjs/common';

export class LeavingGameError extends BadRequestException {
  constructor(message: string) {
    super(`Error leaving game: ${message}`);
  }
}
