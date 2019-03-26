import { BadRequestException } from '@nestjs/common';

export class LeavingGameException extends BadRequestException {
  constructor(message: string) {
    super(`Error leaving game: ${message}`);
  }
}
