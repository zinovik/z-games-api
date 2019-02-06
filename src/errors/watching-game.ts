import { BadRequestException } from '@nestjs/common';

export class WatchingGameError extends BadRequestException {
  constructor(message: string) {
    super(`Error watching game: ${message}`);
  }
}
