import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SqlModule } from './sql.module';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';

@Module({
  imports: [
    ConfigModule,
    SqlModule.forRoot(),
    MongooseModule.forRoot(ConfigService.get().MONGODB_URI, {
      useCreateIndex: true,
      useNewUrlParser: true,
      useFindAndModify: false,
    }),
  ],
})
export class DbModule { }
