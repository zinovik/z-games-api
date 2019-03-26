import { BadRequestException } from '@nestjs/common';

export class ClosingGameException extends BadRequestException {
  constructor(message: string) {
    super(`Error closing game: ${message}`);
  }
}
