import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  static get() {
    dotenv.config();

    if (!process.env.DATABASE_URL && !process.env.MONGODB_URI) {
      process.env.IS_MONGO_USED = 'true';
    }

    return process.env;
  }
}
