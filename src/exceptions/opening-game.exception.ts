import { BadRequestException } from '@nestjs/common';

export class OpeningGameException extends BadRequestException {
  constructor(message: string) {
    super(`Error opening game: ${message}`);
  }
}
