import { BadRequestException } from '@nestjs/common';

export class WatchingGameException extends BadRequestException {
  constructor(message: string) {
    super(`Error watching game: ${message}`);
  }
}
