import { BadRequestException } from '@nestjs/common';

export class StartingGameError extends BadRequestException {
  constructor(message: string) {
    super(`Error starting game: ${message}`);
  }
}
