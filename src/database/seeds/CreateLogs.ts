import { Connection } from 'typeorm';
import { Factory, Seed, times } from 'typeorm-seeding';

import { Log } from '../../../src/api/models/Log';
import { User } from '../../../src/api/models/User';

export class CreateLogs implements Seed {

    public async seed(factory: Factory, connection: Connection): Promise<any> {
        const em = connection.createEntityManager();
        await times(10, async (n) => {
            const log = await factory(Log)().seed();
            const user = await factory(User)().make();
            user.logs = [log];
            return await em.save(user);
        });
    }

}
