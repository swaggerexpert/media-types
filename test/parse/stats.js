import { assert } from 'chai';
import { Stats } from 'apg-lite';

import { parse } from '../../src/index.js';

describe('parse', function () {
  context('stats', function () {
    specify('should not produce stats by default', function () {
      const parseResult = parse('text/html');

      assert.isUndefined(parseResult.stats);
    });

    specify('should produce stats when requested', function () {
      const parseResult = parse('text/html', { stats: true });

      assert.instanceOf(parseResult.stats, Stats);
      assert.isString(parseResult.stats.displayStats());
      assert.isString(parseResult.stats.displayHits());
    });
  });
});
