import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import * as uuid from 'uuid';

import { Log } from '../../../src/api/models/Log';

define(Log, (faker: typeof Faker) => {
    const text = faker.random.words(10);

    const log = new Log();
    log.id = uuid.v1();
    log.text = text;
    log.game = '1';
    log.type = 'move';
    return log;
});
