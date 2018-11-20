import { EntityRepository, Repository } from 'typeorm';

import { Log } from '../models/Log';

@EntityRepository(Log)
export class LogRepository extends Repository<Log> {

  /**
   * Find by user_id is used for our data-loader to get all needed logs in one query.
   */
  public findByUserIds(ids: string[]): Promise<Log[]> {
    return this.createQueryBuilder()
      .select()
      .where(`log.user_id IN (${ids.map(id => `'${id}'`).join(', ')})`)
      .getMany();
  }

}
