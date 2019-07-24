import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { userSchema, logSchema, gameSchema, inviteSchema } from './schemas';

const IS_MONGO_USED = ConfigService.get().IS_MONGO_USED === 'true';
const IS_USE_REAL_MONGODB = IS_MONGO_USED && ConfigService.get().MONGODB_URI;

const mongod = new MongoMemoryServer();

@Module({
  imports: [
    ConfigModule,
    (async () =>
      MongooseModule.forRoot(IS_USE_REAL_MONGODB ? ConfigService.get().MONGODB_URI : await mongod.getConnectionString(), {
        useCreateIndex: true,
        useNewUrlParser: true,
        useFindAndModify: false,
      }))(),
    MongooseModule.forFeature(
      [
        { name: 'User', schema: userSchema },
        { name: 'Game', schema: gameSchema },
        { name: 'Log', schema: logSchema },
        { name: 'Invite', schema: inviteSchema },
      ],
      'DatabaseConnection',
    ),
  ],
})
export class Mongoose {}
