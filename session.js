const session = require('express-session');
const RedisStore = require('connect-redis')(session);

const options = process.env.REDIS_URL ? { url: process.env.REDIS_URL } : {};

module.exports = session({
  store: new RedisStore(options),
  secret: process.env.SECRET || 'localhost test',
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
});
