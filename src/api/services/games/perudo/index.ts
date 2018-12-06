import { Service } from 'typedi';

import { MakingMoveError } from '../../../errors';
import { BaseGame, BaseGameData, BaseGameMove, BaseGamePlayer } from '../base-game';

const PLAYERS_MIN = 2;
const PLAYERS_MAX = 10;

const PLAYER_DICES_COUNT = 5;
const DICE_MAX_FIGURE = 6;
const JOKER_FIGURE = 1;

export interface PerudoData extends BaseGameData {
  currentRound: number;
  isMaputoRound: boolean;
  lastRoundResults: PerudoPlayer[];
  lastRoundFigure: number;
  isLastRoundMaputo: boolean;
  currentDiceFigure: number;
  currentDiceNumber: number;
  players: PerudoPlayer[];
  lastPlayerId: string;
}

export interface PerudoPlayer extends BaseGamePlayer {
  dices: number[];
  dicesCount: number;
}

export interface PerudoMove extends BaseGameMove {
  number: number;
  figure: number;
  notBelieve: boolean;
  isMaputo: boolean;
}

@Service()
export class Perudo extends BaseGame {

  public getNewGame = (): { playersMax: number, playersMin: number, gameData: string } => {
    const gameData: PerudoData = {
      currentRound: 0,
      lastRoundResults: [],
      lastRoundFigure: 0,
      isLastRoundMaputo: false,
      currentDiceFigure: 0,
      currentDiceNumber: 0,
      players: [],
      lastPlayerId: '',
      isMaputoRound: false,
    };

    return {
      playersMax: PLAYERS_MAX,
      playersMin: PLAYERS_MIN,
      gameData: JSON.stringify(gameData),
    };
  }

  public startGame = (gameDataJSON: string): { gameData: string, nextPlayersIds: string[] } => {
    let gameData: PerudoData = JSON.parse(gameDataJSON);

    gameData.players = gameData.players.map(player => {
      return {
        ...player,
        dices: [],
        dicesCount: PLAYER_DICES_COUNT,
        place: 1,
      };
    });

    gameData = this.nextRound(gameData);

    const nextPlayersIds = [gameData.players[Math.floor(Math.random() * gameData.players.length)].id];

    return {
      gameData: JSON.stringify({ ...gameData }), nextPlayersIds,
    };
  }

  public parseGameDataForUser = ({ gameData: gameDataJSON, userId }: { gameData: string, userId: string }): string => {
    const gameData: PerudoData = JSON.parse(gameDataJSON);

    gameData.players.forEach((player, index) => {
      if (player.id !== userId) {
        gameData.players[index] = {
          ...gameData.players[index],
          dices: [],
        };
      }
    });

    return JSON.stringify(gameData);
  }

  public makeMove = ({ gameData: gameDataJSON, move: moveJSON, userId }: { gameData: string, move: string, userId: string }): {
    gameData: string,
    nextPlayersIds: string[],
  } => {
    let gameData: PerudoData = JSON.parse(gameDataJSON);
    const move: PerudoMove = JSON.parse(moveJSON);

    let nextPlayerId: string;

    if (move.notBelieve) {
      if (!gameData.currentDiceNumber || !gameData.currentDiceFigure) {
        throw new MakingMoveError('First move should be bet move');
      }

      let countDiceNumber = 0;

      gameData.players.forEach(player => {
        player.dices.forEach(dice => {
          if (dice === gameData.currentDiceFigure || (!gameData.isMaputoRound && dice === JOKER_FIGURE)) {
            countDiceNumber++;
          }
        });
      });

      const playerNumber = this.getPlayerNumber({ players: gameData.players, userId });
      const lastPlayerNumber = this.getPlayerNumber({ players: gameData.players, userId: gameData.lastPlayerId });

      if (countDiceNumber < gameData.currentDiceNumber) {
        gameData.players[lastPlayerNumber].dicesCount--;

        if (gameData.players[lastPlayerNumber].dicesCount) {
          nextPlayerId = gameData.players[lastPlayerNumber].id;
        } else {
          gameData.players[lastPlayerNumber].place = this.activePlayersCount(gameData.players) + 1;
          nextPlayerId = gameData.players[playerNumber].id;
        }

      } else {
        gameData.players[playerNumber].dicesCount--;

        if (gameData.players[playerNumber].dicesCount) {
          nextPlayerId = gameData.players[playerNumber].id;
        } else {
          gameData.players[playerNumber].place = this.activePlayersCount(gameData.players) + 1;
          nextPlayerId = this.nextPlayer({ players: gameData.players, userId });
        }
      }

      gameData.lastRoundResults = gameData.players.map(player => ({ ...player }));
      gameData.lastRoundFigure = gameData.currentDiceFigure;
      gameData.isLastRoundMaputo = gameData.isMaputoRound;
      gameData.isMaputoRound = false;

      if (this.activePlayersCount(gameData.players) > 1) {
        gameData = this.nextRound(gameData);
      }

    } else {
      if (!this.checkBetCorrect({
        number: move.number,
        figure: move.number,
        currentDiceNumber: gameData.currentDiceNumber,
        currentDiceFigure: gameData.currentDiceFigure,
      })) {
        throw new MakingMoveError('Impossible bet');
      }

      const playerNumber = this.getPlayerNumber({ players: gameData.players, userId });

      if (gameData.players[playerNumber].dicesCount === 1
        && !gameData.currentDiceNumber
        && !gameData.currentDiceFigure
        && this.activePlayersCount(gameData.players) > 2
        && this.countDices(gameData.players) > 3) {
        gameData.isMaputoRound = move.isMaputo;
      }

      gameData.currentDiceNumber = move.number;
      gameData.currentDiceFigure = move.figure;

      gameData.lastPlayerId = userId;
      nextPlayerId = this.nextPlayer({ players: gameData.players, userId });
    }

    const nextPlayersIds = [];
    if (nextPlayerId && this.activePlayersCount(gameData.players) > 1) {
      nextPlayersIds.push(nextPlayerId);
    }

    return { gameData: JSON.stringify(gameData), nextPlayersIds };
  }

  public getRules = (): string => {
    const rules = '';
    return rules;
  }

  private nextRound = (gameData: PerudoData): PerudoData => {
    gameData.currentRound++;
    gameData.currentDiceFigure = 0;
    gameData.currentDiceNumber = 0;

    gameData.players.forEach((player) => {
      player.dices = [];

      for (let j = 0; j < player.dicesCount; j++) {
        player.dices.push(Math.floor(Math.random() * DICE_MAX_FIGURE) + 1);
      }

      player.dices.sort((a, b) => a - b);
    });

    return { ...gameData };
  }

  private nextPlayer = ({ userId, players }: { userId: string, players: PerudoPlayer[] }): string => {
    if (this.activePlayersCount(players) <= 1) {
      return undefined;
    }

    let nextPlayerNumber = this.getPlayerNumber({ players, userId });

    if (nextPlayerNumber >= players.length - 1) {
      nextPlayerNumber = 0;
    } else {
      nextPlayerNumber++;
    }

    if (!players[nextPlayerNumber].dicesCount) {
      return this.nextPlayer({ userId: players[nextPlayerNumber].id, players });
    }

    return players[nextPlayerNumber].id;
  }

  private activePlayersCount = (players: PerudoPlayer[]): number => {
    let activePlayersCount = 0;

    players.forEach((player) => {
      if (player.dicesCount) {
        activePlayersCount++;
      }
    });

    return activePlayersCount;
  }

  private getPlayerNumber = ({ userId, players }: { userId: string, players: PerudoPlayer[] }): number => {
    let playerNumber;

    players.forEach((player, index) => {
      if (player.id === userId) {
        playerNumber = index;
      }
    });

    return playerNumber;
  }

  private countDices = (players: PerudoPlayer[]): number => {
    return players.reduce((diceCount: number, player: PerudoPlayer) => {
      return diceCount + (player.dicesCount || 0);
    }, 0);
  }

  // TODO
  private checkBetCorrect = ({ number, figure, currentDiceNumber, currentDiceFigure }: {
    number: number,
    figure: number,
    currentDiceNumber: number,
    currentDiceFigure: number,
  }): boolean => {
    // if (!number ||
    //   !figure ||
    //   number < currentDiceNumber ||
    //   (number === currentDiceNumber && figure <= currentDiceFigure)) {
    //   return false;
    // }

    return true;
  }
}
