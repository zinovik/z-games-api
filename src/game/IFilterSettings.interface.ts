export interface IFilterSettings {
  isNotStarted: boolean;
  isStarted: boolean;
  isFinished: boolean;
  isWithMe: boolean;
  isWithoutMe: boolean;
  isMyMove: boolean;
  isNotMyMove: boolean;
  isGames: {
    [key: string]: boolean;
  };
  limit: number;
  offset: number;
}
