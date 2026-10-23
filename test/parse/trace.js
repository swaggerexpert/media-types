import { assert } from 'chai';
import { Trace } from 'apg-lite';

import { parse } from '../../src/index.js';

describe('parse', function () {
  context('trace', function () {
    specify('should not produce trace by default', function () {
      const parseResult = parse('text/html');

      assert.isUndefined(parseResult.trace);
    });

    specify('should produce trace when requested', function () {
      const parseResult = parse('text/html', { trace: true });

      assert.instanceOf(parseResult.trace, Trace);
      assert.include(parseResult.trace.displayTrace(), '[RNM(media-type)]');
    });

    specify('should be able to create human-readable trace message', function () {
      const { result, trace } = parse('text/', { trace: true });
      const expectations = trace.inferExpectations();
      const errorMessage = `Invalid media type: "text/". Syntax error at position ${result.maxMatched}, expected ${expectations}`;

      assert.isFalse(result.success);
      assert.strictEqual(
        errorMessage,
        'Invalid media type: "text/". Syntax error at position 5, expected "!", "#", "$", "%", "&", "\'", "*", "+", "-", ".", "^", "_", "`", "|", "~"',
      );
    });
  });
});
