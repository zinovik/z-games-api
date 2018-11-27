import { Connection } from 'typeorm';
import { Factory, Seed, times } from 'typeorm-seeding';

import { Game } from '../../../src/api/models/Game';
import { Log } from '../../../src/api/models/Log';
import { User } from '../../../src/api/models/User';

export class CreateLogs implements Seed {

  public async seed(factory: Factory, connection: Connection): Promise<any> {
    const em = connection.createEntityManager();
    await times(10, async (n) => {
      const user = await factory(User)().make();
      const game = await factory(Game)().make();

      await em.save([user, game]);

      // const log = await factory(Log)({ userId: user.id, gameId: game.id }).seed();

      // user.logs = [log];
      // game.logs = [log];

      return await factory(Log)({ userId: user.id, gameId: game.id }).seed();
    });
  }

}
