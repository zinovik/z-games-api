import { BadRequestException } from '@nestjs/common';

export class CreatingUserException extends BadRequestException {
  constructor(message: string) {
    super(`Error creating user: ${message}`);
  }
}
