import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import * as uuid from 'uuid';

import { Game } from '../../../src/api/models/Game';

define(Game, (faker: typeof Faker) => {
  const name = faker.random.number(1) === 1 ? 'No, Thanks!' : 'Perudo';

  const game = new Game();
  game.id = uuid.v1();
  game.name = name;
  game.playersMin = 2;
  game.playersMax = 10;
  game.gameInfo = JSON.stringify({});
  game.isPrivate = false;
  return game;
});
