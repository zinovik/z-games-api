import { BadRequestException } from '@nestjs/common';

export class StartingGameException extends BadRequestException {
  constructor(message: string) {
    super(`Error starting game: ${message}`);
  }
}
