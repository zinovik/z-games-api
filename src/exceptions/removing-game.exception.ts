import { BadRequestException } from '@nestjs/common';

export class RemovingGameException extends BadRequestException {
  constructor(message: string) {
    super(`Error removing game: ${message}`);
  }
}
