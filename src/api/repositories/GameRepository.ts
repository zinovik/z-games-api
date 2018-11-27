import { EntityRepository, Repository } from 'typeorm';

import { Game } from '../models/Game';

@EntityRepository(Game)
export class GameRepository extends Repository<Game>  {

}
