import { Service } from 'typedi';

import { BaseGame, BaseGameData, BaseGameMove, BaseGamePlayer } from '../base-game';

const PLAYERS_MIN = 1; // TODO: 3
const PLAYERS_MAX = 5;

const MIN_NUMBER = 3;
const MAX_NUMBER = 35;
const START_CHIPS_COUNT = 11;
const EXCESS_CARDS_NUMBER = 9;

export interface NoThanksData extends BaseGameData {
  cards: number[];
  currentCard: number;
  currentCardCost: number;
  cardsLeft: number;
  players: NoThanksPlayer[];
}

export interface NoThanksPlayer extends BaseGamePlayer {
  cards: number[];
  chips: number;
  points: number;
}

export interface NoThanksMove extends BaseGameMove {
  takeCard: boolean;
}

@Service()
export class NoThanks extends BaseGame {

  public getNewGame = (): { playersMax: number, playersMin: number, gameData: string } => {
    const gameData: NoThanksData = {
      cards: [],
      cardsLeft: 0,
      currentCard: 0,
      currentCardCost: 0,
      players: [],
    };

    return {
      playersMax: PLAYERS_MAX,
      playersMin: PLAYERS_MIN,
      gameData: JSON.stringify(gameData),
    };
  }

  public startGame = (gameDataJSON: string): { gameData: string, nextPlayersIds: string[] } => {
    const gameData: NoThanksData = JSON.parse(gameDataJSON);
    const { cards } = gameData;
    let { players } = gameData;

    players = players.map(player => {
      return {
        ...player,
        cards: [],
        chips: START_CHIPS_COUNT,
        points: -START_CHIPS_COUNT,
        place: 0,
      };
    });

    for (let i = MIN_NUMBER; i <= MAX_NUMBER; i++) {
      cards.push(i);
    }

    for (let i = 0; i < EXCESS_CARDS_NUMBER; i++) {
      cards.splice(Math.floor(Math.random() * cards.length), 1);
    }

    const [currentCard] = cards.splice(Math.floor(Math.random() * cards.length), 1);
    const currentCardCost = 0;
    const cardsLeft = cards.length;

    const nextPlayersIds = [players[Math.floor(Math.random() * players.length)].id];

    return {
      gameData: JSON.stringify({
        ...gameData,
        cards,
        cardsLeft,
        currentCard,
        currentCardCost,
        players,
      }), nextPlayersIds,
    };
  }

  public parseGameDataForUser = ({ gameData: gameDataJSON, userId }: { gameData: string, userId: string }): string => {
    const gameData: NoThanksData = JSON.parse(gameDataJSON);

    gameData.players.forEach((player, index) => {
      if (player.id !== userId) {
        gameData.players[index] = {
          ...gameData.players[index],
          chips: 0,
          points: 0,
        };
      }
    });

    return JSON.stringify({ ...gameData, cards: [] });
  }

  public makeMove = ({ gameData: gameDataJSON, move: moveJSON, userId }: { gameData: string, move: string, userId: string }): {
    gameData: string,
    nextPlayersIds: string[],
  } => {
    const gameData: NoThanksData = JSON.parse(gameDataJSON);
    const move: NoThanksMove = JSON.parse(moveJSON);

    const { cards } = gameData;
    let { currentCard, currentCardCost, cardsLeft, players } = gameData;

    const playerNumber = this.getPlayerNumber({ userId, players });

    if (move.takeCard) {
      players[playerNumber].cards.push(currentCard);
      players[playerNumber].cards.sort((a, b) => a - b);
      players[playerNumber].chips += currentCardCost;

      [currentCard] = cards.splice(Math.floor(Math.random() * cards.length), 1);
      cardsLeft = cards.length;
      currentCardCost = 0;
    } else {
      if (!players[playerNumber].chips) {
        throw new Error();
      }

      players[playerNumber].chips--;
      currentCardCost++;
    }

    players[playerNumber].points = this.getPointsForPlayer(players[playerNumber]);

    const nextPlayersIds = [];

    if (cardsLeft) {
      if (playerNumber >= players.length - 1) {
        nextPlayersIds.push(players[0].id);
      } else {
        nextPlayersIds.push(players[playerNumber + 1].id);
      }
    } else {
      players = this.updatePlayerPlaces(players);
    }

    return {
      gameData: JSON.stringify({
        ...gameData,
        cards,
        players,
        currentCard,
        currentCardCost,
        cardsLeft,
      }),
      nextPlayersIds,
    };
  }

  public getRules = (): string => {
    const rules = `No Thanks! is a card game for three to five players designed by Thorsten Gimmler.
Originally called Geschenkt! (presented (as a gift) in German) and published by Amigo Spiele in 2004, it was translated into English by Z-Man Games.

There are playing cards numbered 3 to 35 in the game, and nine cards are removed from the deck.
Each player receives 11 chips. The first player flips over the top card and either takes it (earning him points according to the value)
or passes on the card by paying a chip (placing it on the card).

If a player takes a card, he/she also takes all chips that have been put on the card, that player then flips over the next card
and decides if he/she want it, and so the game continues until all cards have been taken.

At the end of the game, cards give points according to their value,
but cards in a row only count as a single card with the lowest value (e.g. A run of 30, 29, 28, 27 is only worth 27 points.)
Chips are worth one negative point each. The player(s) with the lowest number of points win the game.

No Thanks! was nominated in 2005 for the German Spiel des Jahres (Game of the Year) award`;
    return rules;
  }

  private getPointsForPlayer = (player: NoThanksPlayer): number => {
    let points = 0;
    let lastCard = 0;

    player.cards.forEach(card => {
      if (card !== lastCard + 1) {
        points += card;
      }

      lastCard = card;
    });

    return points - player.chips;
  }

  private updatePlayerPlaces = (players: NoThanksPlayer[]): NoThanksPlayer[] => {
    const playersPlaces = [];

    players.forEach(player => {
      playersPlaces.push({ id: player.id, points: player.points });
    });

    playersPlaces.sort((a, b) => a.points - b.points);

    return players.map(player => {
      let place;

      playersPlaces.forEach((playersPlace, i) => {
        if (player.id === playersPlace.id) {
          place = i + 1;
        }
      });

      return {
        ...player,
        place,
      };
    });
  }

  private getPlayerNumber = ({ userId, players }: { userId: string, players: NoThanksPlayer[] }): number => {
    let playerNumber;

    players.forEach((player, index) => {
      if (player.id === userId) {
        playerNumber = index;
      }
    });

    return playerNumber;
  }
}
