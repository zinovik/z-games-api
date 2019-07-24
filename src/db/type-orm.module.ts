import * as url from 'url';
import { Module, DynamicModule, OnModuleDestroy } from '@nestjs/common';
import { Connection, createConnection } from 'typeorm';
import { ConfigService } from '../config/config.service';

const IS_MONGO_USED = ConfigService.get().IS_MONGO_USED === 'true';

@Module({})
export class TypeOrmModule implements OnModuleDestroy {
  public static forRoot(): DynamicModule {
    const databaseProvider = {
      provide: Connection,
      useFactory: () => {
        if (IS_MONGO_USED || !ConfigService.get().DATABASE_URL) {
          return {};
        }

        const dbUrl = url.parse(ConfigService.get().DATABASE_URL || 'postgres://postgres:dbpass123@localhost:9432/z-games');

        return createConnection({
          type: 'postgres',
          host: dbUrl.host.split(':')[0],
          port: +dbUrl.port,
          username: dbUrl.auth.split(':')[0],
          password: dbUrl.auth.split(':')[1],
          database: dbUrl.path.split('/')[1],
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
        });
      },
    };

    return {
      module: TypeOrmModule,
      providers: [databaseProvider],
      exports: [databaseProvider],
    };
  }

  public constructor(protected connection: Connection) {}

  public onModuleDestroy() {
    return this.connection.close();
  }
}
