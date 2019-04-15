import { BaseGame } from 'z-games-base-game';
import { NoThanks } from 'z-games-no-thanks';
import { Perudo } from 'z-games-perudo';
import { LostCities } from 'z-games-lost-cities';
import { SixNimmt } from 'z-games-six-nimmt';

export const GamesServices: { [key: string]: BaseGame } = {
  [NoThanks.Instance.getName()]: NoThanks.Instance,
  [Perudo.Instance.getName()]: Perudo.Instance,
  [LostCities.Instance.getName()]: LostCities.Instance,
  [SixNimmt.Instance.getName()]: SixNimmt.Instance,
};

export const gamesNames = Object.keys(GamesServices);
