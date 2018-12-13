// import passport from 'passport';
// import { OAuthStrategy } from 'passport-google-oauth';

// import { env } from '../../env';

// passport.use(new OAuthStrategy({
//   consumerKey: env.google.key,
//   consumerSecret: env.google.secret,
//   callbackURL: 'http://www.example.com/auth/google/callback',
// },
//   (token, tokenSecret, profile, done) => {
//     User.findOrCreate({ googleId: profile.id }, (err, user) => {
//       return done(err, user);
//     });
//   }
// ));

// import * as express from 'express';
// import * as passport from 'passport';
// import { ExpressMiddlewareInterface, UnauthorizedError } from 'routing-controllers';
// import { Logger, ILoggerInterface } from '../../decorators/logger';

// export class JWTMiddleware implements ExpressMiddlewareInterface {
//   constructor(
//     @Logger(__filename) private log: ILoggerInterface
//   ) { }

//   // tslint:disable-next-line
//   authenticate = (callback) => passport.authenticate('jwt', { session: false }, callback);

//   use(req: express.Request, res: express.Response, next: express.NextFunction): Promise<passport.Authenticator> {
//     return this.authenticate((err, user, info) => {
//       if (err || !user) {
//         this.log.info('Unauthorized access');
//         this.log.info(info);
//         return next(new UnauthorizedError(info));
//       }

//       req.user = user;
//       return next();
//     })(req, res, next);
//   }
// }
