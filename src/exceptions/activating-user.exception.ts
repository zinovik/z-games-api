import { BadRequestException } from '@nestjs/common';

export class ActivationUserException extends BadRequestException {
  constructor(message: string) {
    super(`Activation user error: ${message}`);
  }
}
