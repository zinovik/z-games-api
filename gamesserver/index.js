// delete current games from user?
// social login
// check current user move
// test
// bot
const bcrypt = require('bcrypt');

const serverGames = {};
serverGames['No, Thanks!'] = require('./games/nothanks');
serverGames.Perudo = require('./games/perudo');

const redis = require('promise-redis')();
const db = require('./db');

const redisClient = (process.env.REDIS_URL) ? redis.createClient(process.env.REDIS_URL) : redis.createClient('6379', '127.0.0.1');

const saltRounds = process.env.SALT_ROUNDS || 10;

class GamesServer {
  constructor() {
    this._usersOnline = {};
    this._games = {};
    this._nextGameNumber = 0;
    db.getServerInfo()
      .then((serverInfo) => {
        this._nextGameNumber = serverInfo.nextGameNumber;
        for (let i = 0; i < this._nextGameNumber; i++) {
          redisClient.get(`game:${i}`)
            .then((gamedataJSON) => {
              if (gamedataJSON === null) return;
              this._games[i] = JSON.parse(gamedataJSON);
              this._games[i].engine = new serverGames[this._games[i].name]();
              this._games[i].engine.setGamedata(this._games[i].gamedata);
              delete this._games[i].gamedata;
            });
        }
      });
  }

  register(username, password, socket) {
    return redisClient.get(`user:${username}`)
      .then((userdataJSON) => {
        if (userdataJSON !== null) return Promise.reject();
        if ((username.length < 3) || (password.length < 3)) return Promise.reject();
        return bcrypt.hash(password, saltRounds);
      })
      .then((hash) => {
        this._usersOnline[username] = {
          socket: socket,
          currentGames: [],
          openGameNumber: null,
        };
        const userdata = {
          password: hash,
          currentGames: [],
          openGameNumber: null,
        };
        redisClient.set(`user:${username}`, JSON.stringify(userdata));
        return Promise.resolve();
      });
  }

  checkUsername(username) {
    return redisClient.get(`user:${username}`)
      .then((userdataJSON) => {
        if (userdataJSON === null) return Promise.reject();
        return Promise.resolve();
      });
  }

  checkPassword(username, password) {
    return redisClient.get(`user:${username}`)
      .then((userdataJSON) => {
        if (userdataJSON === null) return Promise.reject();
        const userdata = JSON.parse(userdataJSON);
        return bcrypt.compare(password, userdata.password);
      })
      .then((res) => {
        if (res) return Promise.resolve();
        return Promise.reject();
      });
  }

  authorize(username, socket) {
    return redisClient.get(`user:${username}`).then((userdataJSON) => {
      if (userdataJSON === null) return Promise.reject();
      const userdata = JSON.parse(userdataJSON);
      this._usersOnline[username] = {
        socket: socket,
        currentGames: userdata.currentGames,
        openGameNumber: userdata.openGameNumber,
      };

      if (userdata.openGameNumber
        && this._games[userdata.openGameNumber]
        && this._games[userdata.openGameNumber].logNchat) {
        this._games[userdata.openGameNumber].logNchat.push({
          type: 'move',
          time: Date.now(),
          username: username,
          text: 'opened the game',
        });
        this._updateGamedata(userdata.openGameNumber);
      }
      return Promise.resolve();
    });
  }

  logout(username) {
    if (!username) return Promise.reject();
    if (!this._usersOnline[username]) return Promise.reject();

    return new Promise((resolve, reject) => {
      redisClient.get(`user:${username}`).then((userdataJSON) => {
        const openGameNumber = this._usersOnline[username].openGameNumber;
        delete this._usersOnline[username];

        if (this._games[openGameNumber] && this._games[openGameNumber].logNchat) {
          // logNchat
          this._games[openGameNumber].logNchat.push({
            type: 'move',
            time: Date.now(),
            username: username,
            text: 'closed the game',
          });
          this._updateGamedata(openGameNumber);
        }

        resolve(openGameNumber);
      });
    });
  }

  _updateUserdata(username, currentGames, openGameNumber) {
    if (!username) return;
    redisClient.get(`user:${username}`).then((userdataJSON) => {
      if (userdataJSON === null) return;
      const userdata = JSON.parse(userdataJSON);
      userdata.currentGames = currentGames;
      userdata.openGameNumber = openGameNumber;
      redisClient.set(`user:${username}`, JSON.stringify(userdata));
    });
  }

  _updateGamedata(gameNumber) {
    if (!gameNumber && gameNumber !== 0) return;
    this._games[gameNumber].gamedata = this._games[gameNumber].engine.getGamedata();
    redisClient.set(`game:${gameNumber}`, JSON.stringify(this._games[gameNumber]))
      .then(() => {
        delete this._games[gameNumber].gamedata;
      });
  }

  _updateUserdata(username, currentGames, openGameNumber) {
    if (!username) return;
    redisClient.get(`user:${username}`).then((userdataJSON) => {
      if (userdataJSON === null) return;
      const userdata = JSON.parse(userdataJSON);
      userdata.currentGames = currentGames;
      userdata.openGameNumber = openGameNumber;
      redisClient.set(`user:${username}`, JSON.stringify(userdata));
    });
  }

  getUsersOnline() {
    const usersOnline = [];
    for (const user in this._usersOnline) {
      usersOnline.push({
        username: user,
        openGameNumber: this._usersOnline[user].openGameNumber,
        currentGames: this._usersOnline[user].currentGames,
      });
    }
    return usersOnline;
  }

  getSocket(username) {
    return this._usersOnline[username] && this._usersOnline[username].socket;
  }

  getGamePlayers(username, gameNumber) {
    if (username) {
      if (!this._usersOnline[username]) return [];
      if (!this._usersOnline[username].openGameNumber) return [];
      if (!this._games[this._usersOnline[username].openGameNumber]) return [];
      return this._games[this._usersOnline[username].openGameNumber].players;
    } else if (gameNumber || (gameNumber === 0)) {
      if (!this._games[gameNumber]) return [];
      return this._games[gameNumber].players;
    }
    return [];
  }

  getGameWatchers(username, gameNumber) {
    if (username) {
      if (!this._usersOnline[username]) return [];
      if (!this._usersOnline[username].openGameNumber) return [];
      if (!this._games[this._usersOnline[username].openGameNumber]) return [];
      return this._games[this._usersOnline[username].openGameNumber].watchers;
    } else if (gameNumber || (gameNumber === 0)) {
      if (!this._games[gameNumber]) return [];
      return this._games[gameNumber].watchers;
    }
    return [];
  }

  getAllGamesInfo() {
    const gamesInfo = [];
    for (const game in this._games) {
      gamesInfo[game] = {
        name: this._games[game].name,
        players: this._games[game].players,
        watchers: this._games[game].watchers,
        timeStarted: this._games[game].timeStarted,
        gameInfo: this._games[game].gameInfo,
      };
    }
    return gamesInfo;
  }

  getOpenGameInfo(username) {
    if (!username) return;
    if (!this._usersOnline[username]) return;
    if (!this._usersOnline[username].openGameNumber) return;

    const gameNumber = this._usersOnline[username].openGameNumber;
    let playerNumber = -1;
    for (let i = 0; i < this._games[gameNumber].players.length; i++) {
      if (this._games[gameNumber].players[i].username === username) {
        playerNumber = i;
      }
    }

    return {
      name: this._games[gameNumber].name,
      rules: this._games[gameNumber].rules,
      players: this._games[gameNumber].players,
      watchers: this._games[gameNumber].watchers,
      nextPlayersNames: this._games[gameNumber].nextPlayersNames,
      logNchat: this._games[gameNumber].logNchat,
      timeStarted: this._games[gameNumber].timeStarted,
      gameInfo: this._games[gameNumber].engine.getGameInfo(playerNumber),
    };
  }

  newGame(gameName, username) {
    if (!serverGames[gameName]) return;

    const engine = new serverGames[gameName]();
    this._games[this._nextGameNumber] = {
      name: gameName,
      engine: engine,
      players: [],
      watchers: [],
      nextPlayersNames: [],
      logNchat: [],
      timeStarted: Date.now(),
      gameInfo: engine.getCommonGameInfo(),
      rules: engine.getRules(),
    };

    // logNchat
    this._games[this._nextGameNumber].logNchat.push({
      type: 'move',
      time: Date.now(),
      username: username,
      text: `created the game #${this._nextGameNumber}`,
    });
    this._updateGamedata(this._nextGameNumber);

    this._nextGameNumber++;
    redisClient.get('server-info')
      .then((serverInfoJSON) => {
        let serverInfo;
        if (serverInfoJSON === null) {
          serverInfo = {};
        } else {
          serverInfo = JSON.parse(serverInfoJSON);
        }
        serverInfo.nextGameNumber = this._nextGameNumber;
        redisClient.set('server-info', JSON.stringify(serverInfo));
      });
    return true;
  }

  joinGame(username, gameNumber) {
    if (!this._games[gameNumber]) return;
    if (!this._usersOnline[username]) return;

    if (this._usersOnline[username].currentGames.indexOf(gameNumber) >= 0) {
      // logNchat
      this._games[gameNumber].logNchat.push({
        type: 'move',
        time: Date.now(),
        username: username,
        text: 'opened the game',
      });
    } else if (this._games[gameNumber].gameInfo.started) {
      let alreadyWatch = false;
      for (let i = 0; i < this._games[gameNumber].watchers.length; i++) {
        if (this._games[gameNumber].watchers[i].username === username) alreadyWatch = true;
      }
      if (!alreadyWatch) {
        this._games[gameNumber].watchers.push({
          username: username,
        });

        // logNchat
        this._games[gameNumber].logNchat.push({
          type: 'move',
          time: Date.now(),
          username: username,
          text: 'started to watch the game',
        });
      }
    } else if (this._games[gameNumber].players.length < this._games[gameNumber].gameInfo.PLAYERS_MAX) {
      this._games[gameNumber].players.push({
        username: username,
        ready: false,
      });

      this._usersOnline[username].currentGames.push(gameNumber);

      // logNchat
      this._games[gameNumber].logNchat.push({
        type: 'move',
        time: Date.now(),
        username: username,
        text: 'joined the game',
      });
    } else {
      return false;
    }

    this._usersOnline[username].openGameNumber = gameNumber;
    this._updateUserdata(username, this._usersOnline[username].currentGames, this._usersOnline[username].openGameNumber);
    this._updateGamedata(gameNumber);
    return true;
  }

  leaveGame(username) {
    if (!username) return;
    if (!this._usersOnline[username]) return;
    if (!this._usersOnline[username].openGameNumber) return;

    const gameNumber = this._usersOnline[username].openGameNumber;

    if (!this._games[gameNumber]) return;

    if (this._usersOnline[username].currentGames.indexOf(gameNumber) >= 0) {
      if (!this._games[gameNumber].gameInfo.started) {
        for (let i = 0; i < this._games[gameNumber].players.length; i++) {
          if (this._games[gameNumber].players[i].username === username) {
            this._games[gameNumber].players.splice(i, 1);
          }
        }

        if (this._usersOnline[username].currentGames.indexOf(gameNumber) >= 0) {
          this._usersOnline[username].currentGames.splice(this._usersOnline[username].currentGames.indexOf(gameNumber), 1);
        }

        delete this._usersOnline[username].openGameNumber;
        this._updateUserdata(username, this._usersOnline[username].currentGames, null);

        // logNchat
        this._games[gameNumber].logNchat.push({
          type: 'move',
          time: Date.now(),
          username: username,
          text: 'left the game',
        });
        this._updateGamedata(gameNumber);
        return gameNumber;
      } else {
        delete this._usersOnline[username].openGameNumber;
        this._updateUserdata(username, this._usersOnline[username].currentGames, null);

        // logNchat
        this._games[gameNumber].logNchat.push({
          type: 'move',
          time: Date.now(),
          username: username,
          text: 'closed the game',
        });
        this._updateGamedata(gameNumber);
        return gameNumber;
      }
    } else {
      for (let i = 0; i < this._games[gameNumber].watchers.length; i++) {
        if (this._games[gameNumber].watchers[i].username === username) {
          this._games[gameNumber].watchers.splice(i, 1);
        }
      }

      delete this._usersOnline[username].openGameNumber;
      this._updateUserdata(username, this._usersOnline[username].currentGames, null);

      // logNchat
      this._games[gameNumber].logNchat.push({
        type: 'move',
        time: Date.now(),
        username: username,
        text: 'left the game',
      });
      this._updateGamedata(gameNumber);
      return gameNumber;
    }
  }

  readyToGame(username) {
    const gameNumber = this._usersOnline[username].openGameNumber;

    if (!this._games[gameNumber]) return;

    for (let i = 0; i < this._games[gameNumber].players.length; i++) {
      if (this._games[gameNumber].players[i].username === username) {
        this._games[gameNumber].players[i].ready = !this._games[gameNumber].players[i].ready;
        // logNchat
        this._games[gameNumber].logNchat.push({
          type: 'move',
          time: Date.now(),
          username: username,
          text: `change status to ${(this._games[gameNumber].players[i].ready) ? 'ready' : 'not ready'}`,
        });
        this._updateGamedata(gameNumber);
        return true;
      }
    }
  }

  startGame(username) {
    if (!username) return;
    if (!this._usersOnline[username]) return;
    const gameNumber = this._usersOnline[username].openGameNumber;
    if (!gameNumber) return;
    if (!this._games[gameNumber]) return;
    if (this._games[gameNumber].gameInfo.started) return;

    if (this._games[gameNumber].players.length < this._games[gameNumber].gameInfo.PLAYERS_MIN) {
      return false;
    }

    let everybodyReady = true;

    for (let i = 0; i < this._games[gameNumber].players.length; i++) {
      everybodyReady = everybodyReady && this._games[gameNumber].players[i].ready;
    }

    if (everybodyReady) {
      this._games[gameNumber].engine.start(Object.keys(this._games[gameNumber].players).length);
      this._games[gameNumber].gameInfo = this._games[gameNumber].engine.getCommonGameInfo();
      this._games[gameNumber].nextPlayersNames = [];
      for (let i = 0; i < this._games[gameNumber].gameInfo.nextPlayers.length; i++) {
        this._games[gameNumber].nextPlayersNames.push(this._games[gameNumber].players[this._games[gameNumber].gameInfo.nextPlayers[i]].username);
      }
      // logNchat
      this._games[gameNumber].logNchat.push({
        type: 'move',
        time: Date.now(),
        username: username,
        text: 'started the game',
      });
      this._updateGamedata(gameNumber);
      return true;
    }
    return false;
  }

  move(username, move) {
    if (!this._usersOnline[username]) return;
    const gameNumber = this._usersOnline[username].openGameNumber;

    const messages = this._games[gameNumber].engine.move(move);
    if (!messages) return;

    for (let i = 0; i < messages.length; i++) {
      // logNchat
      this._games[gameNumber].logNchat.push({
        type: 'move',
        time: Date.now(),
        username: this._games[gameNumber].players[messages[i].playerNumber].username,
        text: messages[i].text,
      });
    }

    this._games[gameNumber].gameInfo = this._games[gameNumber].engine.getCommonGameInfo();
    this._games[gameNumber].nextPlayersNames = [];
    for (let i = 0; i < this._games[gameNumber].gameInfo.nextPlayers.length; i++) {
      this._games[gameNumber].nextPlayersNames.push(this._games[gameNumber].players[this._games[gameNumber].gameInfo.nextPlayers[i]].username);
    }
    if (this._games[gameNumber].gameInfo.finished) {
      // logNchat
      this._games[gameNumber].logNchat.push({
        type: 'event',
        time: Date.now(),
        username: username,
        text: 'The game has been finished!',
      });
      this._updateGamedata(gameNumber);
      return true;
    }
    this._updateGamedata(gameNumber);
    return false;
  }

  addMessage(username, message) {
    if (!username) return;
    if (!this._usersOnline[username]) return;
    if (!this._usersOnline[username].openGameNumber) return;
    if (!this._games[this._usersOnline[username].openGameNumber]) return;
    if (!this._games[this._usersOnline[username].openGameNumber].logNchat) return;

    // logNchat
    this._games[this._usersOnline[username].openGameNumber].logNchat.push({
      type: 'message',
      time: Date.now(),
      username: username,
      text: message,
    });
    this._updateGamedata(this._usersOnline[username].openGameNumber);
    return true;
  }
}

const gameserver = new GamesServer();

module.exports = gameserver;
