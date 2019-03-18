import { BadRequestException } from '@nestjs/common';

export class ActivationUserError extends BadRequestException {
  constructor(message: string) {
    super(`Error activating user: ${message}`);
  }
}
