import { HttpError } from 'routing-controllers';

export class WrongGameName extends HttpError {
  constructor() {
    super(404, 'Wrong game name!');
  }
}
