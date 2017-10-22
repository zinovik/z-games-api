class Perudo {
    
    constructor() {
        this._PLAYER_DICES_NUMBER = 5;
        this._DICE_MAX_FIGURE = 6;
        this._JOKER_FIGURE = 1;

        this._PLAYERS_MIN = 1; // TODO: 2
        this._PLAYERS_MAX = 10;
        this._started = false;
        this._finished = false;
        this._players = [];
        this._nextPlayerNumber = 0;
        this._currentRound = 0;
        this._currentDiceFigure = 0;
        this._currentDiceNumber = 0;
    }

    getRules() {
        let rules = '<p></p>';
        rules += '<p></p>';
        rules += '<p></p>';
        rules += '<p></p>';
        return rules;
    }

    start(playersNumber) {
        for (let i = 0; i < playersNumber; i++) {
            this._players.push({
                cards: [],
                chips: this._START_CHIPS_COUTN,
                points: -this._START_CHIPS_COUTN,
                place: 0
            });
        }

        this._cards = [];
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

        let card = this._currentCard;
        let cardCost = this._currentCardCost;

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

            return 'taked the card ' + card + ' with ' + cardCost + ' chips on it';
        } else if (this._players[this._nextPlayerNumber].chips !== 0) {
            this._players[this._nextPlayerNumber].chips--;
            this._currentCardCost++;

            this._updatePoints(this._players[this._nextPlayerNumber]);
            this._nextPlayer();

            return 'payed 1 chip on the card ' + card + ', ' + (cardCost + 1) + ' chips total on the card';            
        }
    }

    getCommonGameInfo() {
        return {
            PLAYERS_MIN: this._PLAYERS_MIN,
            PLAYERS_MAX: this._PLAYERS_MAX,
            started: this._started,
            finished: this._finished,
            nextPlayers: [this._nextPlayerNumber]
        };
    }

    getGameInfo(userNumber) {
        let gameInfo = {
            PLAYERS_MIN: this._PLAYERS_MIN,
            PLAYERS_MAX: this._PLAYERS_MAX,
            started: this._started,
            finished: this._finished,
            nextPlayers: [this._nextPlayerNumber],
            currentCard: this._currentCard,
            currentCardCost: this._currentCardCost,
            cardsLeft: this._cardsLeft,
            players: []
        };
        for (let i = 0; i < this._players.length; i++) {
            if (this._finished) {
                gameInfo.players[i] = this._players[i]
            } else {
                gameInfo.players[i] = {};
                gameInfo.players[i].cards = this._players[i].cards;
            }
        }
        if ((userNumber || userNumber === 0) && (this._players[userNumber] || this._players[userNumber] === 0)) {
            gameInfo.players[userNumber] = this._players[userNumber];
        }
        return gameInfo;
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
        for (let card of player.cards) {
            if (card !== lastCard + 1) {
                points += +card;
            }
            lastCard = card;
        }

        player.points = points - player.chips;
        this._updatePlaces();
    }

    _updatePlaces() {
        let playersPlaces = [];
        for (let i = 0; i < this._players.length; i++) {
            playersPlaces.push({number: i, points: this._players[i].points});
        }
        function comparePlayers(a, b) {
            if (a.points > b.points) return 1;
            if (a.points < b.points) return -1;
        }
        playersPlaces.sort(comparePlayers);
        for (let i = 0; i < playersPlaces.length; i++) {
            this._players[i].place = playersPlaces[i].number + 1;
        }
    }
}

module.exports = Perudo;