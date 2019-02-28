import dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  static get() {
    dotenv.config();
    return process.env;
  }
}
