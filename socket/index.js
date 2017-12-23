const socketIo = require('socket.io');
const session = require('../session');
const gamesServer = require('../gamesserver');

function socket(server) {
  const io = socketIo.listen(server);

  // update all users
  function updateUsersOnline() {
    io.emit('updateUsersOnline', gamesServer.getUsersOnline());
  }

  function updateAllGamesInfo() {
    io.emit('updateAllGamesInfo', gamesServer.getAllGamesInfo());
  }

  // update open game users
  function updateOpenGameInfo(username, gameNumber) {
    const gamePlayers = gamesServer.getGamePlayers(username, gameNumber);
    for (let i = 0; i < gamePlayers.length; i++) {
      const currentSocket = gamesServer.getSocket(gamePlayers[i].username);
      if (currentSocket) {
        currentSocket.emit('updateOpenGameInfo', gamesServer.getOpenGameInfo(gamePlayers[i].username));
      }
    }
    const gameWatchers = gamesServer.getGameWatchers(username, gameNumber);
    for (let i = 0; i < gameWatchers.length; i++) {
      const currentSocket = gamesServer.getSocket(gameWatchers[i].username);
      if (currentSocket) {
        currentSocket.emit('updateOpenGameInfo', gamesServer.getOpenGameInfo(gameWatchers[i].username));
      }
    }
  }

  io.use((socket, next) => {
    session(socket.request, socket.request.res, next);
  });

  io.on('connection', (socket) => {
    if (socket.request.session.name) {
      socket.request.session._garbage = Date();
      gamesServer.checkUsername(socket.request.session.name)
        .then(() => {
          gamesServer.authorize(socket.request.session.name, socket).then(() => {
            socket.emit('setUsername', socket.request.session.name);
            updateUsersOnline();
          });
        });
    }

    // update by browser request (e.g., page refresh)
    socket.on('getAllGamesInfo', () => {
      socket.emit('updateAllGamesInfo', gamesServer.getAllGamesInfo());
    });

    socket.on('getOpenGameInfo', () => {
      if (socket.request.session.name) {
        socket.emit('updateOpenGameInfo', gamesServer.getOpenGameInfo(socket.request.session.name));
      }
    });

    socket.on('getUsersOnline', () => {
      socket.emit('updateUsersOnline', gamesServer.getUsersOnline());
    });

    socket.on('getCurrentUsername', () => {
      socket.emit('updateCurrentUsername', socket.request.session.name);
    });

    // authorize, register, logout
    socket.on('authorize', (username, password) => {
      gamesServer.checkPassword(username, password)
        .then(() => {
          return gamesServer.authorize(username, socket);
        })
        .then(() => {
          socket.emit('updateCurrentUsername', username);
          updateUsersOnline();
          updateOpenGameInfo(username);
          socket.request.session.name = username;
          socket.request.session.save();
        })
        .catch(() => {
          socket.emit('updateCurrentUsername', null);
        });
    });

    socket.on('register', (username, password) => {
      gamesServer.register(username, password, socket).then(() => {
        socket.emit('updateCurrentUsername', username);
        updateUsersOnline();
        socket.request.session.name = username;
        socket.request.session.save();
      });
    });

    socket.on('logout', () => {
      if (socket.request.session.name) {
        gamesServer.logout(socket.request.session.name).then((gameNumber) => {
          socket.emit('updateCurrentUsername');
          updateUsersOnline();
          updateAllGamesInfo();
          updateOpenGameInfo(null, gameNumber);
          delete socket.request.session.name;
          socket.request.session.save();
        });
      }
    });

    socket.on('disconnect', () => {
      if (socket.request.session.name) {
        gamesServer.logout(socket.request.session.name).then((gameNumber) => {
          updateUsersOnline();
          updateAllGamesInfo();
          updateOpenGameInfo(null, gameNumber);
        });
      }
    });

    // game actions
    socket.on('newgame', (gameName) => {
      if (gamesServer.newGame(gameName, socket.request.session.name)) {
        updateAllGamesInfo();
      }
    });

    socket.on('joingame', (gameNumber) => {
      if (gamesServer.joinGame(socket.request.session.name, gameNumber)) {
        updateUsersOnline();
        updateAllGamesInfo();
        updateOpenGameInfo(socket.request.session.name);
      }
    });

    socket.on('leavegame', () => {
      const gameNumber = gamesServer.leaveGame(socket.request.session.name);
      if (gameNumber || (gameNumber === 0)) {
        updateUsersOnline();
        updateAllGamesInfo();
        updateOpenGameInfo(null, gameNumber);
      }
    });

    socket.on('readytogame', () => {
      gamesServer.readyToGame(socket.request.session.name);
      updateOpenGameInfo(socket.request.session.name);
    });

    socket.on('startgame', () => {
      gamesServer.startGame(socket.request.session.name);
      updateAllGamesInfo();
      updateOpenGameInfo(socket.request.session.name);
    });

    socket.on('move', (move) => {
      if (gamesServer.move(socket.request.session.name, move)) {
        updateAllGamesInfo();
      }
      updateOpenGameInfo(socket.request.session.name);
    });

    socket.on('message', (message) => {
      gamesServer.addMessage(socket.request.session.name, message);
      updateOpenGameInfo(socket.request.session.name);
    });
  });
}

module.exports = socket;
