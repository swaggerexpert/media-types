import { assert } from 'chai';

import { parse } from '../../src/index.js';

describe('parse', function () {
  context('Accept', function () {
    const parseAccept = (source) => parse(source, { type: 'accept' });

    context('example from RFC 9110', function () {
      // https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1
      specify('should parse', function () {
        const parseResult = parseAccept('audio/*; q=0.2, audio/basic');

        assert.isTrue(parseResult.result.success);
        assert.deepEqual(parseResult.tree, [
          { type: 'audio', subtype: '*', parameters: {}, weight: 0.2 },
          { type: 'audio', subtype: 'basic', parameters: {}, weight: 1 },
        ]);
      });
    });

    context('example from RFC 9110 with media range parameters', function () {
      // https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1
      specify('should parse', function () {
        const parseResult = parseAccept('text/*, text/plain, text/plain;format=flowed, */*');

        assert.isTrue(parseResult.result.success);
        assert.deepEqual(parseResult.tree, [
          { type: 'text', subtype: '*', parameters: {}, weight: 1 },
          { type: 'text', subtype: 'plain', parameters: {}, weight: 1 },
          { type: 'text', subtype: 'plain', parameters: { format: 'flowed' }, weight: 1 },
          { type: '*', subtype: '*', parameters: {}, weight: 1 },
        ]);
      });
    });

    context('"q" parameter', function () {
      specify('should be processed as weight regardless of parameter ordering', function () {
        const parseResult = parseAccept('text/html;Q=0.5;level=1');

        assert.isTrue(parseResult.result.success);
        assert.deepEqual(parseResult.tree, [
          { type: 'text', subtype: 'html', parameters: { level: '1' }, weight: 0.5 },
        ]);
      });

      specify('should use first occurrence as weight', function () {
        const parseResult = parseAccept('text/html;q=0.5;q=0.1');

        assert.deepEqual(parseResult.tree[0], {
          type: 'text',
          subtype: 'html',
          parameters: {},
          weight: 0.5,
        });
      });

      ['0', '0.', '0.1', '0.12', '0.123', '1', '1.', '1.0', '1.00', '1.000'].forEach((qvalue) => {
        specify(`should accept qvalue ${qvalue}`, function () {
          const parseResult = parseAccept(`text/html;q=${qvalue}`);

          assert.strictEqual(parseResult.tree[0].weight, parseFloat(qvalue));
        });
      });

      ['0.1234', '1.001', '1.1', '2', '-1', 'abc', '.5'].forEach((qvalue) => {
        specify(`should produce NaN weight for invalid qvalue ${qvalue}`, function () {
          const parseResult = parseAccept(`text/html;q=${qvalue}`);

          assert.isTrue(parseResult.result.success);
          assert.isNaN(parseResult.tree[0].weight);
        });
      });
      specify('should treat quoted qvalue as equivalent to token', function () {
        // https://www.rfc-editor.org/rfc/rfc9110#section-5.6.6
        const parseResult = parseAccept('text/html;q="0.5"');

        assert.strictEqual(parseResult.tree[0].weight, 0.5);
      });
    });

    context('list syntax', function () {
      specify('should allow empty field value', function () {
        const parseResult = parseAccept('');

        assert.isTrue(parseResult.result.success);
        assert.deepEqual(parseResult.tree, []);
      });

      specify('should allow empty list elements', function () {
        // https://www.rfc-editor.org/rfc/rfc9110#section-5.6.1.2
        const parseResult = parseAccept(',text/html , ,\t*/*,');

        assert.isTrue(parseResult.result.success);
        assert.deepEqual(parseResult.tree, [
          { type: 'text', subtype: 'html', parameters: {}, weight: 1 },
          { type: '*', subtype: '*', parameters: {}, weight: 1 },
        ]);
      });
    });

    context('given invalid source string', function () {
      ['text', 'text/html ;q=0.5 ', 'text/html;q', 'text/html,,text'].forEach((source) => {
        specify(`should fail parsing ${JSON.stringify(source)}`, function () {
          const parseResult = parseAccept(source);

          assert.isFalse(parseResult.result.success);
          assert.isUndefined(parseResult.tree);
        });
      });
    });
  });
});
