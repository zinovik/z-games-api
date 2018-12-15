import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework-w3tec';
import { Container } from 'typedi';
import { getConnection } from 'typeorm';

import { GameService } from '../api/services/GameService';
import { Initialize1544900578366 } from '../database/migrations/1544900578366-Initialize';

export const databaseLoader: MicroframeworkLoader = async (settings: MicroframeworkSettings | undefined) => {

  const gameService: GameService = Container.get(GameService);

  if (!settings) {
    return undefined;
  }

  try {
    await gameService.getAllGames({ ignoreNotStarted: false, ignoreStarted: false, ignoreFinished: false });
  } catch (error) {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    const migration = new Initialize1544900578366();

    await migration.up(queryRunner);

    console.log('New database tables created!');
  }

};
