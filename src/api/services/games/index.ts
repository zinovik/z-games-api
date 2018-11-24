// delete current games from user
// social login
// check current user move
// tests
// bots
// game modules
import { NoThanks } from './no-thanks';
import { Perudo } from './perudo';

const serverGames = {
  'No, Thanks!': NoThanks,
  'Perudo': Perudo,
};

export class GamesServer {
  private static instance: GamesServer;

  private _usersOnline: {};
  private _games: {};
  private _nextGameNumber = 0;

  public static get Instance() {
    return this.instance || (this.instance = new this());
  }

  constructor() {
    this._usersOnline = {};
    this._games = {};
    this._nextGameNumber = 0;
  }

  _updateGamedata(gameNumber) {
    if (!gameNumber && gameNumber !== 0) {
      return;
    }

    this._games[gameNumber].gamedata = this._games[gameNumber].engine.getGamedata();
  }

  getUsersOnline() {
    const usersOnline = [];

    Object.keys(this._usersOnline).forEach((user) => {
      usersOnline.push({
        username: user,
        openGameNumber: this._usersOnline[user].openGameNumber,
        currentGames: this._usersOnline[user].currentGames,
      });
    });

    return usersOnline;
  }

  getSocket(username) {
    return this._usersOnline[username] && this._usersOnline[username].socket;
  }

  getGamePlayers(username, gameNumber) {
    if (username) {
      if ((!this._usersOnline[username]) ||
        (!this._usersOnline[username].openGameNumber) ||
        (!this._games[this._usersOnline[username].openGameNumber])) {
        return [];
      }

      return this._games[this._usersOnline[username].openGameNumber].players;
    } else if (gameNumber || (gameNumber === 0)) {
      if (!this._games[gameNumber]) {
        return [];
      }

      return this._games[gameNumber].players;
    }

    return [];
  }

  getGameWatchers(username, gameNumber) {
    if (username) {
      if ((!this._usersOnline[username]) ||
        (!this._usersOnline[username].openGameNumber) ||
        (!this._games[this._usersOnline[username].openGameNumber])) {
        return [];
      }

      return this._games[this._usersOnline[username].openGameNumber].watchers;

    } else if (gameNumber || (gameNumber === 0)) {
      if (!this._games[gameNumber]) {
        return [];
      }

      return this._games[gameNumber].watchers;
    }

    return [];
  }

  getAllGamesInfo() {
    const gamesInfo = [];

    Object.keys(this._games).forEach((game) => {
      gamesInfo[game] = {
        name: this._games[game].name,
        players: this._games[game].players,
        watchers: this._games[game].watchers,
        timeStarted: this._games[game].timeStarted,
        gameInfo: this._games[game].gameInfo,
      };
    });

    return gamesInfo;
  }

  getOpenGameInfo(username) {
    if ((!username) ||
      (!this._usersOnline[username]) ||
      (!this._usersOnline[username].openGameNumber && this._usersOnline[username].openGameNumber !== 0)) {
      return undefined;
    }

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
    if (!serverGames[gameName]) {
      return undefined;
    }

    const engine = new serverGames[gameName]();

    this._games[this._nextGameNumber] = {
      name: gameName,
      engine,
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
      username,
      text: `created the game #${this._nextGameNumber}`,
    });

    this._updateGamedata(this._nextGameNumber);

    this._nextGameNumber++;

    return true;
  }

  joinGame(username, gameNumber) {
    if (!this._games[gameNumber] || !this._usersOnline[username]) {
      return undefined;
    }

    if (this._usersOnline[username].currentGames.indexOf(gameNumber) >= 0) {
      // logNchat
      this._games[gameNumber].logNchat.push({
        type: 'move',
        time: Date.now(),
        username,
        text: 'opened the game',
      });
    } else if (this._games[gameNumber].gameInfo.started) {
      let alreadyWatch = false;

      this._games[gameNumber].watchers.forEach((watcher) => {
        if (watcher.username === username) {
          alreadyWatch = true;
        }
      });

      if (!alreadyWatch) {
        this._games[gameNumber].watchers.push({
          username,
        });

        // logNchat
        this._games[gameNumber].logNchat.push({
          type: 'move',
          time: Date.now(),
          username,
          text: 'started to watch the game',
        });
      }
    } else if (this._games[gameNumber].players.length < this._games[gameNumber].gameInfo.PLAYERS_MAX) {
      this._games[gameNumber].players.push({
        username,
        ready: false,
      });

      this._usersOnline[username].currentGames.push(gameNumber);

      // logNchat
      this._games[gameNumber].logNchat.push({
        type: 'move',
        time: Date.now(),
        username,
        text: 'joined the game',
      });
    } else {
      return false;
    }

    this._usersOnline[username].openGameNumber = gameNumber;
    this._updateGamedata(gameNumber);

    return true;
  }

  leaveGame(username) {
    if ((!username) ||
      (!this._usersOnline[username]) ||
      (!this._usersOnline[username].openGameNumber && this._usersOnline[username].openGameNumber !== 0)) {
      return;
    }

    const gameNumber = this._usersOnline[username].openGameNumber;

    if (!this._games[gameNumber]) {
      return;
    }

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

        // logNchat
        this._games[gameNumber].logNchat.push({
          type: 'move',
          time: Date.now(),
          username,
          text: 'left the game',
        });
        this._updateGamedata(gameNumber);

        return gameNumber;
      } else {
        delete this._usersOnline[username].openGameNumber;

        // logNchat
        this._games[gameNumber].logNchat.push({
          type: 'move',
          time: Date.now(),
          username,
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

      // logNchat
      this._games[gameNumber].logNchat.push({
        type: 'move',
        time: Date.now(),
        username,
        text: 'left the game',
      });
      this._updateGamedata(gameNumber);

      return gameNumber;
    }
  }

  readyToGame(username) {
    const gameNumber = this._usersOnline[username].openGameNumber;

    if (!this._games[gameNumber]) {
      return;
    }

    this._games[gameNumber].players.forEach((player) => {
      if (player.username === username) {
        player.ready = !player.ready;

        // logNchat
        this._games[gameNumber].logNchat.push({
          type: 'move',
          time: Date.now(),
          username,
          text: `change status to ${(player.ready) ? 'ready' : 'not ready'}`,
        });
        this._updateGamedata(gameNumber);

        return true;
      }

      return undefined;
    });
  }

  startGame(username) {
    if ((!username) || (!this._usersOnline[username])) {
      return undefined;
    }

    const gameNumber = this._usersOnline[username].openGameNumber;

    if ((!gameNumber && gameNumber !== 0) ||
      (!this._games[gameNumber]) ||
      (this._games[gameNumber].gameInfo.started)) {

      return undefined;
    }

    if (this._games[gameNumber].players.length < this._games[gameNumber].gameInfo.PLAYERS_MIN) {
      return false;
    }

    let everybodyReady = true;

    this._games[gameNumber].players.forEach((player) => {
      everybodyReady = everybodyReady && player.ready;
    });

    if (everybodyReady) {
      this._games[gameNumber].engine.start(Object.keys(this._games[gameNumber].players).length);
      this._games[gameNumber].gameInfo = this._games[gameNumber].engine.getCommonGameInfo();
      this._games[gameNumber].nextPlayersNames = [];

      this._games[gameNumber].gameInfo.nextPlayers.forEach((nextPlayer) => {
        this._games[gameNumber].nextPlayersNames.push(this._games[gameNumber].players[nextPlayer].username);
      });

      // logNchat
      this._games[gameNumber].logNchat.push({
        type: 'move',
        time: Date.now(),
        username,
        text: 'started the game',
      });
      this._updateGamedata(gameNumber);

      return true;
    }

    return false;
  }

  move(username, move) {
    if (!this._usersOnline[username]) {
      return undefined;
    }

    const gameNumber = this._usersOnline[username].openGameNumber;

    const messages = this._games[gameNumber].engine.move(move);

    if (!messages) {
      return undefined;
    }

    messages.forEach((message) => {
      // logNchat
      this._games[gameNumber].logNchat.push({
        type: 'move',
        time: Date.now(),
        username: this._games[gameNumber].players[message.playerNumber].username,
        text: message.text,
      });
    });

    this._games[gameNumber].gameInfo = this._games[gameNumber].engine.getCommonGameInfo();
    this._games[gameNumber].nextPlayersNames = [];

    this._games[gameNumber].gameInfo.nextPlayers.forEach((nextPlayer) => {
      this._games[gameNumber].nextPlayersNames.push(this._games[gameNumber].players[nextPlayer].username);
    });

    if (this._games[gameNumber].gameInfo.finished) {
      // logNchat
      this._games[gameNumber].logNchat.push({
        type: 'event',
        time: Date.now(),
        username,
        text: 'The game has been finished!',
      });
      this._updateGamedata(gameNumber);

      return true;
    }
    this._updateGamedata(gameNumber);

    return false;
  }

  addMessage(username, message) {
    if ((!username) ||
      (!this._usersOnline[username]) ||
      (!this._usersOnline[username].openGameNumber && this._usersOnline[username].openGameNumber !== 0) ||
      (!this._games[this._usersOnline[username].openGameNumber]) ||
      (!this._games[this._usersOnline[username].openGameNumber].logNchat)) {
      return undefined;
    }

    // logNchat
    this._games[this._usersOnline[username].openGameNumber].logNchat.push({
      type: 'message',
      time: Date.now(),
      username,
      text: message,
    });
    this._updateGamedata(this._usersOnline[username].openGameNumber);

    return true;
  }
}
