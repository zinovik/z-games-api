
export interface BaseGameData {
  players: BaseGamePlayer[];
}

export interface BaseGamePlayer {
  id: string;
  ready: boolean;
  place: number;
}

export interface BaseGameMove {
}

export class BaseGame {

  getNewGame: () => { playersMax: number, playersMin: number, gameData: string };

  startGame: (gameData: string) => { gameData: string, nextPlayersIds: string[] };

  parseGameDataForUser: ({ gameData, userId }: { gameData: string, userId: string }) => string;

  makeMove: ({ gameData, move, userId }: { gameData: string, move: string, userId: string }) => {
    gameData: string,
    nextPlayersIds: string[],
  };

  getRules: () => string;

  addPlayer({ gameData: gameDataJSON, userId }: { gameData: string, userId: string }): string {
    const gameData: BaseGameData = JSON.parse(gameDataJSON);
    const { players } = gameData;

    players.push({
      id: userId,
      ready: false,
    } as BaseGamePlayer);

    return JSON.stringify({ ...gameData, players });
  }

  toggleReady = ({ gameData: gameDataJSON, userId }: { gameData: string, userId: string }): string => {
    const gameData: BaseGameData = JSON.parse(gameDataJSON);
    let { players } = gameData;

    players = players.map(player => {
      if (player.id === userId) {
        return { ...player, ready: !player.ready };
      }
      return player;
    });

    return JSON.stringify({ ...gameData, players });
  }

  removePlayer = ({ gameData: gameDataJSON, userId }: { gameData: string, userId: string }): string => {
    const gameData: BaseGameData = JSON.parse(gameDataJSON);
    let { players } = gameData;

    players = players.filter(player => player.id !== userId);

    return JSON.stringify({ ...gameData, players });
  }

}
