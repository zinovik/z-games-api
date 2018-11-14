import * as express from 'express';
import { ExpressMiddlewareInterface, Middleware } from 'routing-controllers';

import session from '../../session';

@Middleware({ type: 'before' })
export class SessionMiddleware implements ExpressMiddlewareInterface {

    public use(req: express.Request, res: express.Response, next: express.NextFunction): any {
        return session(req, res, next);
    }

}
