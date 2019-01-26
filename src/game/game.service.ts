import { Injectable } from '@nestjs/common';

import { Game } from '../db/entities/game.entity';

@Injectable()
export class GameService {

  getAllGames({ ignoreNotStarted, ignoreStarted, ignoreFinished }: {
    ignoreNotStarted: boolean,
    ignoreStarted: boolean,
    ignoreFinished: boolean,
  }) {
    console.log(ignoreNotStarted, ignoreStarted, ignoreFinished);

    return new Promise((resolve) => {
      console.log(2);
    });
  }

}
