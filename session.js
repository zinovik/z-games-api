var session = require('express-session');
//var RedisStore = require("connect-redis")(session);

module.exports = session({
  //store: new RedisStore({}),
  secret: process.env.SECRET || 'localhost test',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
});