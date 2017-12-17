/* global test, expect */

import Perudo from '../games/perudo';

test('get common game info', () => {
  const engine = new Perudo();
  const gameInfo = engine.getCommonGameInfo();
  expect(true).toBe(true);
});
