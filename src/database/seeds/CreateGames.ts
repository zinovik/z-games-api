import { Factory, Seed } from 'typeorm-seeding';
import { Connection } from 'typeorm/connection/Connection';

import { Game } from '../../../src/api/models/Game';

export class CreateGames implements Seed {

  public async seed(factory: Factory, connection: Connection): Promise<any> {
    await factory(Game)().seedMany(10);
  }

}
