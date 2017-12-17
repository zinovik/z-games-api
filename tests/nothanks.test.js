/* global test, expect */

import NoThanks from '../games/nothanks';

test('get common game info', () => {
  const engine = new NoThanks();
  const gameInfo = engine.getCommonGameInfo();
  expect(true).toBe(true);
});
