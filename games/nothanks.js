class NoThanks {
  constructor() {
    this._MIN_NUMBER = 3;
    this._MAX_NUMBER = 35;
    this._START_CHIPS_COUTN = 11;
    this._EXCESS_CARDS_NUMBER = 9;

    this._PLAYERS_MIN = 1; // TODO: 3
    this._PLAYERS_MAX = 5;
    this._started = false;
    this._finished = false;
    this._players = [];
    this._nextPlayerNumber = 0;
    this._currentCard = 0;
    this._currentCardCost = 0;
    this._cardsLeft = this._MAX_NUMBER - this._EXCESS_CARDS_NUMBER;
    this._cards = [];
  }

  getRules() {
    let rules = '<p>No Thanks! is a card game for three to five players designed by Thorsten Gimmler. Originally called Geschenkt! (presented (as a gift) in German) and published by Amigo Spiele in 2004, it was translated into English by Z-Man Games.</p>';
    rules += '<p>There are playing cards numbered 3 to 35 in the game, and nine cards are removed from the deck. Each player receives 11 chips. The first player flips over the top card and either takes it (earning him points according to the value) or passes on the card by paying a chip (placing it on the card). If a player takes a card, he/she also takes all chips that have been put on the card, that player then flips over the next card and decides if he/she want it, and so the game continues until all cards have been taken.</p>';
    rules += '<p>At the end of the game, cards give points according to their value, but cards in a row only count as a single card with the lowest value (e.g. A run of 30, 29, 28, 27 is only worth 27 points.) Chips are worth one negative point each. The player(s) with the lowest number of points win the game.</p>';
    rules += '<p>No Thanks! was nominated in 2005 for the German Spiel des Jahres (Game of the Year) award.</p>';
    return rules;
  }

  start(playersNumber) {
    for (let i = 0; i < playersNumber; i++) {
      this._players.push({
        cards: [],
        chips: this._START_CHIPS_COUTN,
        points: -this._START_CHIPS_COUTN,
        place: 0,
      });
    }

    for (let i = this._MIN_NUMBER; i <= this._MAX_NUMBER; i++) {
      this._cards.push(i);
    }
    for (let i = 0; i < this._EXCESS_CARDS_NUMBER; i++) {
      this._cards.splice(Math.floor(Math.random() * this._cards.length), 1);
    }

    this._nextPlayerNumber = Math.floor(Math.random() * this._players.length);
    this._nextCard();
    this._started = true;
  }

  move(move) {
    if (this._finished) return;

    const card = this._currentCard;
    const cardCost = this._currentCardCost;
    const currentPlayerNumber = this._nextPlayerNumber;

    if (move.takeCard) {
      this._players[this._nextPlayerNumber].cards.push(this._currentCard);
      function compareCards(a, b) {
        if (+a > +b) return 1;
        if (+a < +b) return -1;
      }
      this._players[this._nextPlayerNumber].cards.sort(compareCards);

      this._players[this._nextPlayerNumber].chips += this._currentCardCost;
      this._nextCard();

      this._updatePoints(this._players[this._nextPlayerNumber]);
      this._nextPlayer();

      const messages = [];
      messages.push({ playerNumber: currentPlayerNumber, text: `taked the card ${card} with ${cardCost} chips on it` });
      return messages;
    } else if (this._players[this._nextPlayerNumber].chips !== 0) {
      this._players[this._nextPlayerNumber].chips--;
      this._currentCardCost++;

      this._updatePoints(this._players[this._nextPlayerNumber]);
      this._nextPlayer();

      const messages = [];
      messages.push({ playerNumber: currentPlayerNumber, text: `payed 1 chip on the card ${card}, ${cardCost + 1} chips total on the card` });
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
      currentCard: this._currentCard,
      currentCardCost: this._currentCardCost,
      cardsLeft: this._cardsLeft,
      players: [],
    };
    for (let i = 0; i < this._players.length; i++) {
      if (this._finished) {
        gameInfo.players[i] = this._players[i];
      } else {
        gameInfo.players[i] = {};
        gameInfo.players[i].cards = this._players[i].cards;
      }
    }
    if ((userNumber || userNumber === 0)
      && (this._players[userNumber] || this._players[userNumber] === 0)) {
      gameInfo.players[userNumber] = this._players[userNumber];
    }
    return gameInfo;
  }

  getGamedata() {
    return {
      started: this._started,
      finished: this._finished,
      nextPlayers: [this._nextPlayerNumber],
      currentCard: this._currentCard,
      currentCardCost: this._currentCardCost,
      cardsLeft: this._cardsLeft,
      players: this._players,
      cards: this._cards,
    };
  }

  setGamedata(gameInfo) {
    if (!gameInfo) return;
    this._started = gameInfo.started;
    this._finished = gameInfo.finished;
    this._nextPlayerNumber = gameInfo.nextPlayers[0];
    this._currentCard = gameInfo.currentCard;
    this._currentCardCost = gameInfo.currentCardCost;
    this._cardsLeft = gameInfo.cardsLeft;
    this._players = gameInfo.players;
    this._cards = gameInfo.cards;
    return true;
  }

  _nextCard() {
    if (this._cards.length > 0) {
      this._currentCard = this._cards.splice(Math.floor(Math.random() * this._cards.length), 1)[0];
      this._currentCardCost = 0;
    } else {
      this._finished = true;
    }
    this._cardsLeft = this._cards.length;
  }

  _nextPlayer() {
    if (this._nextPlayerNumber >= this._players.length - 1) {
      this._nextPlayerNumber = 0;
    } else {
      this._nextPlayerNumber++;
    }
  }

  _updatePoints(player) {
    let points = 0;
    let lastCard = 0;
    for (const card of player.cards) {
      if (card !== lastCard + 1) {
        points += +card;
      }
      lastCard = card;
    }

    player.points = points - player.chips;
    this._updatePlaces();
  }

  _updatePlaces() {
    const playersPlaces = [];

    for (let i = 0; i < this._players.length; i++) {
      playersPlaces.push({ number: i, points: this._players[i].points });
    }

    playersPlaces.sort((a, b) => {
      if (a.points > b.points) return -1;
      if (a.points < b.points) return 1;
      return 0;
    });

    for (let i = 0; i < playersPlaces.length; i++) {
      this._players[i].place = i + 1;
    }
  }
}

module.exports = NoThanks;
