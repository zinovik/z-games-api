import { BadRequestException } from '@nestjs/common';

export class InvalidFileError extends BadRequestException {
  constructor(message: string) {
    super(`Invalid file format: ${message}`);
  }
}
