import { Module } from '@nestjs/common';

import { TypeOrmModule } from './type-orm.module';
import { Mongoose } from './mongoose.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    Mongoose,
  ],
})
export class DbModule { }
