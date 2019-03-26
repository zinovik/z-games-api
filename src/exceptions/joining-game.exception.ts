import { BadRequestException } from '@nestjs/common';

export class JoiningGameException extends BadRequestException {
  constructor(message: string) {
    super(`Error joining game: ${message}`);
  }
}
