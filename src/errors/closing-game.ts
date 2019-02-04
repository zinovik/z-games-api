import { BadRequestException } from '@nestjs/common';

export class ClosingGameError extends BadRequestException {
  constructor(message: string) {
    super(`Error closing game: ${message}`);
  }
}
