import { BadRequestException } from '@nestjs/common';

export class CreatingUserError extends BadRequestException {
  constructor(message: string) {
    super(`Error creating user: ${message}`);
  }
}
