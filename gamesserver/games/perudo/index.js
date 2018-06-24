class Perudo {
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

  getRules() {
    let rules = '<p>Perudo is a dice game. The object of perudo is to be the last player with a die or more. </p>';
    rules += '<p>Perudo is played in rounds. Each player receives a cup and five dice. Each round begins by all players rolling their dice around in the cup. After shaking the dice, players turn the cups over on a table top, so that the dice are rolled and under the cups. Each player may peek in his own cup. </p>';
    rules += '<p>Players bid, guessing at the number of rolls. When a player believes that another player has over-estimated, they say Dudo, which means I doubt in Spanish. </p>';
    rules += '<p>The first player announces a number, and then the next player has the choice of doubting it, by saying Dudo or raising the bid, either by the number of dice or by the value of the dice. (or by doing both) For example, if player 1 bid three twos, then player two could bid three threes, four twos, four fours, or even ten sixes. </p>';
    rules += '<p>After player 2 bids, play goes on to the left. </p>';
    rules += '<p>If a player calls Dudo, and is correct, then the player must show the dice, and each player must show their dice to verify whether the number was indeed too high. </p>';
    rules += '<p>If there are enough dice of that number, then the player who called Dudo must place a die in the discard pile. If there are not, then the player who made the last bid must place a die in the middle. In either case, a new round begins.</p>';
    rules += '<p>The player who lost a die in the last round is the first player in the new round. If the player lost his last die, then the player to his left plays first instead. Players may bid Aces (ones) in a round, and halve the previous number announced. If the number does not halve, they should round up. The next player will need to bid more aces or to bid one more than double the number bid in order to bid a different number. </p>';
    rules += '<p>If a player has lost his fourth die, the round after losing the fourth die is played differently. The player is called Palafico. First, aces are not wild. Next, the player may begin with aces, and third, players who have not been palafico before may only bid on the same number that the player before them bid on. The palafico rules do not apply when there are only two players left!</p>';
    rules += '<p>The last player left with at least one die wins the game. ("Perudo" is a registered trademark of University Games Corporation, Burlingame, CA.) </p>';
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
    if (this._finished) return;

    if (move.notBelieve) {
      if (!this._currentDiceNumber || !this._currentDiceFigure) return;

      const messages = [];
      messages.push({ playerNumber: this._nextPlayerNumber, text: `doesn't believe that on the table ${this._currentDiceNumber} dices with "${this._currentDiceFigure}"` });

      const allDices = [];
      let countDiceNumber = 0;
      for (let i = 0; i < this._players.length; i++) {
        for (let j = 0; j < this._players[i].dices.length; j++) {
          allDices.push(this._players[i].dices[j]);
          if (this._players[i].dices[j] == this._currentDiceFigure || this._players[i].dices[j] == this._JOKER_FIGURE) {
            countDiceNumber++;
          }
        }
      }

      function compareFigures(a, b) {
        if (+a > +b) return 1;
        if (+a < +b) return -1;
      }
      allDices.sort(compareFigures);
      messages.push({ playerNumber: this._nextPlayerNumber, text: `counts ${countDiceNumber} dices with "${this._currentDiceFigure}" (${allDices})` });

      if (countDiceNumber < this._currentDiceNumber) {
        const fine = Math.min(this._currentDiceNumber - countDiceNumber, this._players[this._lastPlayerNumber].dicesCount);
        this._players[this._lastPlayerNumber].dicesCount = this._players[this._lastPlayerNumber].dicesCount - fine;
        messages.push({ playerNumber: this._lastPlayerNumber, text: `looses ${fine} dices` });
        if (this._players[this._lastPlayerNumber].dicesCount === 0) {
          this._players[this._lastPlayerNumber].place = this._activePlayersCount() + 1;
          messages.push({ playerNumber: this._lastPlayerNumber, text: `finishes on ${this._players[this._lastPlayerNumber].place} place` });
        } else {
          this._nextPlayerNumber = this._lastPlayerNumber;
        }
      } else {
        const fine = Math.min(Math.max(countDiceNumber - this._currentDiceNumber, 1), this._players[this._nextPlayerNumber].dicesCount);
        this._players[this._nextPlayerNumber].dicesCount = this._players[this._nextPlayerNumber].dicesCount - fine;
        messages.push({ playerNumber: this._nextPlayerNumber, text: `looses ${fine} dices` });
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
      if (!move.number || !move.figure) return;
      if (move.number < this._currentDiceNumber || (move.number == this._currentDiceNumber && move.figure <= this._currentDiceFigure)) return;

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
      cards: this._cards,
    };
  }

  setGamedata(gameInfo) {
    if (!gameInfo) return;
    this._started = gameInfo.started;
    this._finished = gameInfo.finished;
    this._nextPlayerNumber = gameInfo.nextPlayers[0];
    this._lastPlayerNumber = gameInfo.lastPlayerNumber;
    this._currentRound = gameInfo.currentRound;
    this._currentDiceFigure = gameInfo.currentDiceFigure;
    this._currentDiceNumber = gameInfo.currentDiceNumber;
    this._lastRoundResults = gameInfo.lastRoundResults;
    this._players = gameInfo.players;
    this._cards = gameInfo.cards;
    return true;
  }

  _nextRound() {
    function compareFigures(a, b) {
      if (+a > +b) return 1;
      if (+a < +b) return -1;
    }
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
      for (let i = 0; i < this._players.length; i++) {
        this._players[i].dices = [];
        for (let j = 0; j < this._players[i].dicesCount; j++) {
          this._players[i].dices.push(Math.floor(Math.random() * this._DICE_MAX_FIGURE) + 1);
        }
        this._players[i].dices.sort(compareFigures);
      }
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
    if (this._finished) return;

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
    for (let i = 0; i < this._players.length; i++) {
      if (this._players[i].dicesCount > 0) {
        activePlayersCount++;
      }
    }
    return activePlayersCount;
  }
}

module.exports = Perudo;
