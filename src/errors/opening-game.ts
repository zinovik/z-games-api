import { BadRequestException } from '@nestjs/common';

export class OpeningGameError extends BadRequestException {
  constructor(message: string) {
    super(`Error opening game: ${message}`);
  }
}
