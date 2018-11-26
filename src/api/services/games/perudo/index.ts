import { Service } from 'typedi';

const PLAYERS_MIN = 2;
const PLAYERS_MAX = 10;

export interface PerudoData {
  players: any;
}

@Service()
export class Perudo {
  private _PLAYER_DICES_COUNT = 5;
  private _DICE_MAX_FIGURE = 6;
  private _JOKER_FIGURE = 1;

  private _PLAYERS_MIN = 2;
  private _PLAYERS_MAX = 10;
  private _started = false;
  private _finished = false;
  private _players = [];
  private _nextPlayerNumber = 0;
  private _lastPlayerNumber = 0;
  private _currentRound = 0;
  private _currentDiceFigure = 0;
  private _currentDiceNumber = 0;
  private _lastRoundResults = {};

  constructor() {
    this._PLAYER_DICES_COUNT = 5;
    this._DICE_MAX_FIGURE = 6;
    this._JOKER_FIGURE = 1;

    this._PLAYERS_MIN = 2;
    this._PLAYERS_MAX = 10;
    this._started = false;
    this._finished = false;
    this._players = [];
    this._nextPlayerNumber = 0;
    this._lastPlayerNumber = 0;
    this._currentRound = 0;
    this._currentDiceFigure = 0;
    this._currentDiceNumber = 0;
    this._lastRoundResults = {};
  }

  getNewGame(): { playersMax: number, playersMin: number, gameData: string } {
    const gameData: PerudoData = {
      players: {},
    };

    return {
      playersMax: PLAYERS_MAX,
      playersMin: PLAYERS_MIN,
      gameData: JSON.stringify(gameData),
    };
  }

  startGame(gameData: string): { gameData: string, nextPlayerId: string } {
    const { cards, cardsLeft, players } = JSON.parse(gameData);

    Object.keys(players).forEach(username => {
      players[username] = {
        cards: [],
        place: 0,
      };
    });

    const [currentCard] = cards.splice(Math.floor(Math.random() * cards.length), 1);
    const currentCardCost = 0;

    const nextPlayerId = Object.keys(players)[Math.floor(Math.random() * Object.keys(players).length)];

    return { gameData: JSON.stringify({ cards, cardsLeft, currentCard, currentCardCost, players }), nextPlayerId };
  }

  getRules() {
    const rules = '';
    return rules;
  }

  start(playersNumber) {
    for (let i = 0; i < playersNumber; i++) {
      this._players.push({
        dicesCount: this._PLAYER_DICES_COUNT,
        dices: [],
        place: 0,
      });
    }

    this._nextPlayerNumber = Math.floor(Math.random() * this._players.length);
    this._nextRound();
    this._started = true;
  }

  move(move) {
    if (this._finished) {
      return undefined;
    }

    if (move.notBelieve) {
      if (!this._currentDiceNumber || !this._currentDiceFigure) {
        return undefined;
      }

      const messages = [];

      messages.push({
        playerNumber: this._nextPlayerNumber,
        text: `doesn't believe that on the table ${this._currentDiceNumber} dices with "${this._currentDiceFigure}"`,
      });

      const allDices = [];
      let countDiceNumber = 0;

      this._players.forEach((player) => {
        player.dices.forEach((dice) => {
          allDices.push(dice);

          if (dice === this._currentDiceFigure || dice === this._JOKER_FIGURE) {
            countDiceNumber++;
          }
        });
      });

      allDices.sort((a, b) => (a - b));
      messages.push({ playerNumber: this._nextPlayerNumber, text: `counts ${countDiceNumber} dices with "${this._currentDiceFigure}" (${allDices})` });

      if (countDiceNumber < this._currentDiceNumber) {
        this._players[this._lastPlayerNumber].dicesCount = this._players[this._lastPlayerNumber].dicesCount - 1;
        messages.push({ playerNumber: this._lastPlayerNumber, text: `looses 1 dice` });

        if (this._players[this._lastPlayerNumber].dicesCount === 0) {
          this._players[this._lastPlayerNumber].place = this._activePlayersCount() + 1;
          messages.push({ playerNumber: this._lastPlayerNumber, text: `finishes on ${this._players[this._lastPlayerNumber].place} place` });
        } else {
          this._nextPlayerNumber = this._lastPlayerNumber;
        }
      } else {
        this._players[this._nextPlayerNumber].dicesCount = this._players[this._nextPlayerNumber].dicesCount - 1;
        messages.push({ playerNumber: this._nextPlayerNumber, text: `looses 1 dice` });

        if (this._players[this._nextPlayerNumber].dicesCount === 0) {
          this._players[this._nextPlayerNumber].place = this._activePlayersCount() + 1;
          messages.push({ playerNumber: this._nextPlayerNumber, text: `finishes on ${this._players[this._nextPlayerNumber].place} place` });
        }
      }

      this._nextRound();

      return messages;
    } else {
      move.number = +move.number;
      move.figure = +move.figure;

      if (!move.number ||
        !move.figure ||
        move.number < this._currentDiceNumber ||
        (move.number === this._currentDiceNumber && move.figure <= this._currentDiceFigure)) {
        return undefined;
      }

      this._currentDiceNumber = move.number;
      this._currentDiceFigure = move.figure;

      const messages = [];
      messages.push({ playerNumber: this._nextPlayerNumber, text: `bets that on the table ${move.number} dices with "${move.figure}"` });

      this._lastPlayerNumber = this._nextPlayerNumber;
      this._nextPlayer();

      return messages;
    }
  }

  getCommonGameInfo() {
    return {
      PLAYERS_MIN: this._PLAYERS_MIN,
      PLAYERS_MAX: this._PLAYERS_MAX,
      started: this._started,
      finished: this._finished,
      nextPlayers: [this._nextPlayerNumber],
    };
  }

  getGameInfo(userNumber) {
    const gameInfo = {
      PLAYERS_MIN: this._PLAYERS_MIN,
      PLAYERS_MAX: this._PLAYERS_MAX,
      started: this._started,
      finished: this._finished,
      nextPlayers: [this._nextPlayerNumber],
      lastPlayerNumber: this._lastPlayerNumber,
      currentRound: this._currentRound,
      currentDiceFigure: this._currentDiceFigure,
      currentDiceNumber: this._currentDiceNumber,
      lastRoundResults: this._lastRoundResults,
      players: [],
    };

    for (let i = 0; i < this._players.length; i++) {
      if (this._finished) {
        gameInfo.players[i] = this._players[i];
      } else {
        gameInfo.players[i] = {};
        gameInfo.players[i].dicesCount = this._players[i].dicesCount;
      }
    }

    if ((userNumber || userNumber === 0) && (this._players[userNumber] || this._players[userNumber] === 0)) {
      gameInfo.players[userNumber] = this._players[userNumber];
    }

    return gameInfo;
  }

  getGamedata() {
    return {
      started: this._started,
      finished: this._finished,
      nextPlayers: [this._nextPlayerNumber],
      lastPlayerNumber: this._lastPlayerNumber,
      currentRound: this._currentRound,
      currentDiceFigure: this._currentDiceFigure,
      currentDiceNumber: this._currentDiceNumber,
      lastRoundResults: this._lastRoundResults,
      players: this._players,
    };
  }

  setGamedata(gameInfo) {
    if (!gameInfo) {
      return undefined;
    }

    this._started = gameInfo.started;
    this._finished = gameInfo.finished;
    this._nextPlayerNumber = gameInfo.nextPlayers[0];
    this._lastPlayerNumber = gameInfo.lastPlayerNumber;
    this._currentRound = gameInfo.currentRound;
    this._currentDiceFigure = gameInfo.currentDiceFigure;
    this._currentDiceNumber = gameInfo.currentDiceNumber;
    this._lastRoundResults = gameInfo.lastRoundResults;
    this._players = gameInfo.players;

    return true;
  }

  _nextRound() {
    if (this._currentRound > 0) {
      this._lastRoundResults = {};

      for (let i = 0; i < this._players.length; i++) {
        this._lastRoundResults[i] = JSON.parse(JSON.stringify(this._players[i].dices));
      }
    }

    if (this._activePlayersCount() > 1) {
      this._currentRound++;
      this._currentDiceFigure = 0;
      this._currentDiceNumber = 0;

      this._players.forEach((player) => {
        player.dices = [];

        for (let j = 0; j < player.dicesCount; j++) {
          player.dices.push(Math.floor(Math.random() * this._DICE_MAX_FIGURE) + 1);
        }

        player.dices.sort((a, b) => (a - b));
      });
    } else {
      if (this._players[this._nextPlayerNumber].place) {
        this._players[this._lastPlayerNumber].place = 1;
      } else {
        this._players[this._nextPlayerNumber].place = 1;
      }

      this._finished = true;
    }
  }

  _nextPlayer() {
    if (this._finished) {
      return undefined;
    }

    if (this._nextPlayerNumber >= this._players.length - 1) {
      this._nextPlayerNumber = 0;
    } else {
      this._nextPlayerNumber++;
    }

    if (!this._players[this._nextPlayerNumber].dicesCount) {
      this._nextPlayer();
    }
  }

  _activePlayersCount() {
    let activePlayersCount = 0;

    this._players.forEach((player) => {
      if (player.dicesCount > 0) {
        activePlayersCount++;
      }
    });

    return activePlayersCount;
  }
}
