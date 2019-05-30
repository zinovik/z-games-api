import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';
import axios from 'axios';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cors());
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT || 4000);
}
bootstrap();

// Prevent Heroku Node App From Sleeping
const BASE_URL = process.env.BASE_URL || 'https://z-games-api.herokuapp.com';
setInterval(async () => {
  try {
    await axios.get(BASE_URL);
  } catch (error) {
    //
  }
}, 15 * 60 * 1000); // every 15 minutes
