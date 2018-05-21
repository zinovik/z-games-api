const express = require('express');

const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require('fs');

const session = require('./session');

const app = express();

require('dotenv').load();

fs.writeFile(`${__dirname}/public/index.html`, `<!DOCTYPE html>
<html>
  <head>
    <title>Games Server</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script>
      window.location.href = "${process.env.clientURL || 'http://localhost:8100'}";
    </script>
  </head>
  <body>
  </body>
</html>`, (err) => {
  if (err) {
    console.error(err);
  }
});

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session);
app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.end('wrong request');
});

module.exports = app;
