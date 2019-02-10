import * as url from 'url';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';

import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';

const dbUrl = url.parse(ConfigService.get().DATABASE_URL);

const additionalModules = [];
if (ConfigService.get().USE_MONGO === 'true') {
  additionalModules.push(MongooseModule.forRoot(ConfigService.get().MONGODB_URI));
}

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: dbUrl.host.split(':')[0],
      port: +dbUrl.port,
      username: dbUrl.auth.split(':')[0],
      password: dbUrl.auth.split(':')[1],
      database: dbUrl.path.split('/')[1],
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    ...additionalModules,
  ],
})
export class DbModule { }
