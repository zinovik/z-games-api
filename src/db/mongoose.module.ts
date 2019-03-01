import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import MongoMemoryServer from 'mongodb-memory-server';

import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { userSchema } from './schemas/user.schema';
import { logSchema } from './schemas/log.schema';
import { gameSchema } from './schemas/game.schema';

const IS_MONGO_USED = ConfigService.get().IS_MONGO_USED === 'true';

const mongod = new MongoMemoryServer();

@Module({
  imports: [
    ConfigModule,
    (async () => {
      return MongooseModule.forRoot(IS_MONGO_USED ? ConfigService.get().MONGODB_URI : await mongod.getConnectionString(), {
        useCreateIndex: true,
        useNewUrlParser: true,
        useFindAndModify: false,
      });
    })(),
    MongooseModule.forFeature([
      { name: 'User', schema: userSchema },
      { name: 'Game', schema: gameSchema },
      { name: 'Log', schema: logSchema },
    ]),
  ],
})
export class Mongoose { }
