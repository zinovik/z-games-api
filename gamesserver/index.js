var serverGames = {};
serverGames['No, Thanks!'] = require('../games/nothanks');
serverGames['Perudo'] = require('../games/perudo');

class GamesServer {

    constructor() {
        // var redis = require('redis');
        // this._client = redis.createClient('6379', process.env.REDIS_URL || '127.0.0.1');
        // this._client.on('connect', function() {
        //     console.log('connected');
        // });

        this._users = {};
        this._games = {};
        this._nextGameNumber = 0;
    }

    register(username, password, socket) {
        if (this._users[username]) return;
        if ((username.length < 3) || (password.length < 3)) return;

        this._users[username] = {
            password: password,
            socket: socket,
            online: true,
            currentGames: []
        };

        // this._client.set(username, JSON.stringify({password, currentGames: []}));
        return true;
    }

    checkUsername(username) {
        // this._client.get(username, function(err, reply) {
        //     console.log(reply);
        // });
        return this._users[username];
    }

    checkPassword(username, password) {
        if (!this._users[username]) return;

        if (this._users[username].password === password) {
            return true;
        }
    }

    authorize(username, socket) {
        if (!this._users[username]) return;

        this._users[username].online = true;
        this._users[username].socket = socket;
        return true;
    }

    logout(username) {
        if (!this._users[username]) return;

        if (this._users[username].online) {
            this._users[username].online = false;
            return true;
        }
    }

    getUsersOnline() {
        let usersOnline = [];
        for (let user in this._users) {
            if (this._users[user].online) {
                usersOnline.push({
                    username: user,
                    openGameNumber: this._users[user].openGameNumber,
                    currentGames: this._users[user].currentGames
                });
            }
        }
        return usersOnline;
    }

    getSocket(username) {
        if (!this._users[username]) return;
        return this._users[username].socket;
    }

    getGamePlayers(username, gameNumber) {
        if (username) {
            if (this._users[username].openGameNumber && this._games[this._users[username].openGameNumber]) {
                return this._games[this._users[username].openGameNumber].players;
            }
        } else if (gameNumber || (gameNumber === 0)) {
            if (this._games[gameNumber]) {
                return this._games[gameNumber].players;
            }
        }
        return [];
    }

    getGameWatchers(username, gameNumber) {
        if (username) {
            if (this._users[username].openGameNumber && this._games[this._users[username].openGameNumber]) {
                return this._games[this._users[username].openGameNumber].watchers;
            }
        } else if (gameNumber || (gameNumber === 0)) {
            if (this._games[gameNumber]) {
                return this._games[gameNumber].watchers;
            }
        }
        return [];
    }

    getAllGamesInfo() {
        let gamesInfo = [];
        for (let game in this._games) {
            gamesInfo[game] = {
                name: this._games[game].name,
                players: this._games[game].players,
                watchers: this._games[game].watchers,
                timeStarted: this._games[game].timeStarted,
                gameInfo: this._games[game].gameInfo
            };
        }
        return gamesInfo;
    }

    getOpenGameInfo(username) {
        if (!username) return;
        if (!this._users[username]) return;
        if (!this._users[username].openGameNumber) return;

        let gameNumber = this._users[username].openGameNumber;
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
            gameInfo: this._games[gameNumber].engine.getGameInfo(playerNumber)
        };
    }

    newGame(gameName, username) {
        if (!serverGames[gameName]) return;

        let engine = new serverGames[gameName];
        this._games[this._nextGameNumber] = {
            name: gameName,
            engine: engine,
            players: [],
            watchers: [],
            nextPlayersNames: [],
            logNchat: [],
            timeStarted: Date.now(),
            gameInfo: engine.getCommonGameInfo(),
            rules: engine.getRules()
        };

        // logNchat
        this._games[this._nextGameNumber].logNchat.push({
            type: 'move',
            time: Date.now(),
            username: username,
            text: 'created the game #' + this._nextGameNumber
        });

        this._nextGameNumber++;
        return true;
    }

    joinGame(username, gameNumber) {
        if (!this._games[gameNumber]) return;
        if (!this._users[username]) return;

        if (this._users[username].currentGames.indexOf(gameNumber) >= 0) {
            for (let i = 0; i < this._games[gameNumber].players.length; i++) {
                if (this._games[gameNumber].players[i].username === username) {
                    this._games[gameNumber].players[i].online = true;
                }
            }

            // logNchat
            this._games[gameNumber].logNchat.push({
                type: 'move',
                time: Date.now(),
                username: username,
                text: 'rejoined the game'
            });
        } else {
            if (this._games[gameNumber].gameInfo.started) {
                this._games[gameNumber].watchers.push({
                    username: username
                });

                // logNchat
                this._games[gameNumber].logNchat.push({
                    type: 'move',
                    time: Date.now(),
                    username: username,
                    text: 'started to watch the game'
                });
            } else {
                if (this._games[gameNumber].players.length < this._games[gameNumber].gameInfo.PLAYERS_MAX)
                {
                    this._games[gameNumber].players.push({
                        username: username,
                        ready: false,
                        online: true
                    });

                    this._users[username].currentGames.push(gameNumber);

                    // logNchat
                    this._games[gameNumber].logNchat.push({
                        type: 'move',
                        time: Date.now(),
                        username: username,
                        text: 'joined the game'
                    });
                } else {
                    return false;
                }
            }
        }

        this._users[username].openGameNumber = gameNumber;
        return true;
    }

    leaveGame(username) {
        if (!username) return;
        if (!this._users[username]) return;
        if (!this._users[username].openGameNumber) return;

        let gameNumber = this._users[username].openGameNumber;

        if (!this._games[gameNumber]) return;

        if (this._users[username].currentGames.indexOf(gameNumber) >= 0) {
            if (!this._games[gameNumber].gameInfo.started) {
                for (let i = 0; i < this._games[gameNumber].players.length; i++) {
                    if (this._games[gameNumber].players[i].username === username) {
                        this._games[gameNumber].players.splice(i, 1);
                    }
                }

                if (this._users[username].currentGames.indexOf(gameNumber) >= 0) {
                    this._users[username].currentGames.splice(this._users[username].currentGames.indexOf(gameNumber), 1);
                }

                delete this._users[username].openGameNumber;

                // logNchat
                this._games[gameNumber].logNchat.push({
                    type: 'move',
                    time: Date.now(),
                    username: username,
                    text: 'left the game'
                });
                return gameNumber;
            } else {
                for (let i = 0; i < this._games[gameNumber].players.length; i++) {
                    if (this._games[gameNumber].players[i].username === username) {
                        this._games[gameNumber].players[i].online = false;
                    }
                }

                delete this._users[username].openGameNumber;

                // logNchat
                this._games[gameNumber].logNchat.push({
                    type: 'move',
                    time: Date.now(),
                    username: username,
                    text: 'came out from the game'
                });
                return gameNumber;
            }
        } else {
            for (let i = 0; i < this._games[gameNumber].watchers.length; i++) {
                if (this._games[gameNumber].watchers[i].username === username) {
                    this._games[gameNumber].watchers.splice(i, 1);
                }
            }

            delete this._users[username].openGameNumber;

            // logNchat
            this._games[gameNumber].logNchat.push({
                type: 'move',
                time: Date.now(),
                username: username,
                text: 'left the game'
            });
            return gameNumber;
        }
    }

    readyToGame(username) {
        let gameNumber = this._users[username].openGameNumber;

        if (!this._games[gameNumber]) return;

        for (let i = 0; i < this._games[gameNumber].players.length; i++) {
            if (this._games[gameNumber].players[i].username === username) {
                this._games[gameNumber].players[i].ready = !this._games[gameNumber].players[i].ready;
                // logNchat
                this._games[gameNumber].logNchat.push({
                    type: 'move',
                    time: Date.now(),
                    username: username,
                    text: 'change status to ' + ((this._games[gameNumber].players[i].ready) ? 'ready' : 'not ready')
                });
                return true;
            }                
        }
    }

    startGame(username) {
        let gameNumber = this._users[username].openGameNumber;

        if (!this._games[gameNumber]) return;

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
                text: 'started the game'
            });
            return true;
        }
    }

    move(username, move) {
        let gameNumber = this._users[username].openGameNumber;

        let logNchatText = this._games[gameNumber].engine.move(move);

        // logNchat
        this._games[gameNumber].logNchat.push({
            type: 'move',
            time: Date.now(),
            username: username,
            text: logNchatText
        });

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
                text: 'The game has been finished!'
            });
            return true;
        }
        return false;
    }

    addMessage(username, message) {
        if (!username) return;
        if (!this._users[username]) return;
        if (!this._users[username].openGameNumber) return;
        if (!this._games[this._users[username].openGameNumber]) return;
        if (!this._games[this._users[username].openGameNumber].logNchat) return;

        // logNchat
        this._games[this._users[username].openGameNumber].logNchat.push({
            type: 'message',
            time: Date.now(),
            username: username,
            text: message
        });
    }
}

let gameserver = new GamesServer();

module.exports = gameserver;