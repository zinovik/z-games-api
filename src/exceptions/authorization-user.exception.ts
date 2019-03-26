import { BadRequestException } from '@nestjs/common';

export class AuthorizationUserException extends BadRequestException {
  constructor(message: string) {
    super(`Error authorization user: ${message}`);
  }
}
