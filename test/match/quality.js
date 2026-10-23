import { assert } from 'chai';

import { quality } from '../../src/index.js';

describe('quality', function () {
  context('example from RFC 9110 (Table 5)', function () {
    // https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1
    // Expected values include the correction from https://www.rfc-editor.org/errata/eid7138
    const accept =
      'text/*;q=0.3, text/plain;q=0.7, text/plain;format=flowed,\n       text/plain;format=fixed;q=0.4, */*;q=0.5'.replace(
        /\n\s+/,
        ' ',
      );
    const table = [
      ['text/plain;format=flowed', 1],
      ['text/plain', 0.7],
      ['text/html', 0.3],
      ['image/jpeg', 0.5],
      ['text/plain;format=fixed', 0.4],
      ['text/html;level=3', 0.3],
    ];

    table.forEach(([mediaType, expected]) => {
      specify(`should associate ${expected} with ${mediaType}`, function () {
        assert.strictEqual(quality(accept, mediaType), expected);
      });
    });
  });

  specify('should return 1 when Accept is missing', function () {
    assert.strictEqual(quality(undefined, 'text/html'), 1);
  });

  specify('should return 0 when nothing matches', function () {
    assert.strictEqual(quality('text/*', 'image/png'), 0);
    assert.strictEqual(quality('text/*;q=0', 'text/plain'), 0);
  });

  specify('should return 0 for invalid media type', function () {
    assert.strictEqual(quality('*/*', 'garbage'), 0);
    assert.strictEqual(quality(undefined, 'garbage'), 0);
  });

  specify('should ignore invalid Accept elements', function () {
    assert.strictEqual(quality('text/html;level, image/*;q=0.5', 'image/png'), 0.5);
    assert.strictEqual(quality('text/html;level, image/*;q=0.5', 'text/html'), 0);
  });

  specify('should ignore Accept elements with invalid qvalue', function () {
    assert.strictEqual(quality('text/html;q=2, */*;q=0.1', 'text/html'), 0.1);
  });

  specify('should treat Accept without usable elements as no preference', function () {
    assert.strictEqual(quality('garbage', 'image/png'), 1);
    assert.strictEqual(quality('', 'image/png'), 1);
    assert.strictEqual(quality('text/html;q=abc', 'image/png'), 1);
  });
});
