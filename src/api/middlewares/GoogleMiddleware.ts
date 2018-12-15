import express from 'express';
import passport from 'passport';
import { OAuth2Strategy } from 'passport-google-oauth';
import { ExpressMiddlewareInterface, UnauthorizedError } from 'routing-controllers';

import { Logger, LoggerInterface } from '../../decorators/Logger';
import { env } from '../../env';

export class GoogleMiddleware implements ExpressMiddlewareInterface {

  constructor(
    @Logger(__filename) private log: LoggerInterface
  ) {
    passport.use(new OAuth2Strategy({
      clientID: env.google.key,
      clientSecret: env.google.secret,
      callbackURL:
        `${env.app.schema}://${env.app.host}${env.app.port !== 4000 ? '' : `:${env.app.port}`}${env.app.routePrefix}/users/authorize/google/callback`,
      accessType: 'offline',
    },
      (token, tokenSecret, profile, done) => {
        return done(undefined, profile);
      }));
  }

  public use(req: express.Request, res: express.Response, next: express.NextFunction): Promise<passport.Authenticator> {

    return passport.authenticate('google', { session: false, scope: ['email', 'profile'] }, (err, user, info) => {
      if (err || !user) {
        this.log.info('Unauthorized access');
        this.log.info(info);
        return next(new UnauthorizedError(info));
      }

      req.user = user;
      return next();
    })(req, res, next);

  }
}
