import connectRedis from 'connect-redis';
import session from 'express-session';

const RedisStore = connectRedis(session);
const store = process.env.REDIS_URL ? new RedisStore({ url: process.env.REDIS_URL }) : new RedisStore({});

export default session({
  store,
  secret: process.env.SECRET || 'localhost test',
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
});
