import { BadRequestException } from '@nestjs/common';

export class JoiningGameError extends BadRequestException {
  constructor(message: string) {
    super(`Error joining game: ${message}`);
  }
}
