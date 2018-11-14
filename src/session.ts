import connectRedis from 'connect-redis';
import session from 'express-session';

const RedisStore = connectRedis(session);

const options = process.env.REDIS_URL ? { url: process.env.REDIS_URL } : {};

export default session({
    store: new RedisStore(options),
    secret: process.env.SECRET || 'localhost test',
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
});
