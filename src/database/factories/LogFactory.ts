import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import * as uuid from 'uuid';

import { Log } from '../../../src/api/models/Log';

define(Log, (faker: typeof Faker, settings: { userId: string, gameId: string }) => {
  const text = faker.random.words(10);

  const log = new Log();
  log.id = uuid.v1();
  log.text = text;
  log.type = 'move';
  log.userId = settings.userId;
  log.gameId = settings.gameId;
  return log;
});
