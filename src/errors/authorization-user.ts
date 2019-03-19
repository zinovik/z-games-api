import { BadRequestException } from '@nestjs/common';

export class AuthorizationUserError extends BadRequestException {
  constructor(message: string) {
    super(`Error authorization user: ${message}`);
  }
}
