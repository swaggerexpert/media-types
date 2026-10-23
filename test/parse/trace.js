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
        'Invalid media type: "text/". Syntax error at position 5, expected "!", "#", "$", "%", "&", "\'", "*", "+", "-", ".", "^", "_", "`", "|", "~", "0-9", "A-Z", "a-z"',
      );
    });

    specify('should infer expectations at the end of the source', function () {
      const { trace } = parse('text/html;charset="abc', { type: 'media-type', trace: true });

      assert.deepEqual(Array.from(trace.inferExpectations()), [
        '\\x09',
        '\\x20',
        '!',
        '#-[',
        ']-~',
        '\\x80-\\xFF',
        '\\',
        '"',
      ]);
    });

    specify('should infer expectations only at the furthest offset', function () {
      const { trace } = parse('text/html;charset=', { type: 'media-type', trace: true });
      const expectations = Array.from(trace.inferExpectations());

      assert.include(expectations, '"');
      assert.include(expectations, 'a-z');
      assert.notInclude(expectations, ';');
    });
  });
});
