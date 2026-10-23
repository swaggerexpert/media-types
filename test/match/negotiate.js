import { assert } from 'chai';

import { negotiate } from '../../src/index.js';

describe('negotiate', function () {
  specify('should order media types by preference', function () {
    const accept =
      'text/*;q=0.3, text/plain;q=0.7, text/plain;format=flowed, text/plain;format=fixed;q=0.4, */*;q=0.5';

    assert.deepEqual(
      negotiate(accept, ['text/html', 'image/jpeg', 'text/plain', 'text/plain;format=flowed']),
      ['text/plain;format=flowed', 'text/plain', 'image/jpeg', 'text/html'],
    );
  });

  specify('should omit media types that are not acceptable', function () {
    assert.deepEqual(
      negotiate('text/html, application/json;q=0', ['application/json', 'text/html']),
      ['text/html'],
    );
    assert.deepEqual(negotiate('text/*', ['application/json']), []);
  });

  specify('should prefer more specific media range on equal weight', function () {
    assert.deepEqual(negotiate('*/*, application/json', ['text/html', 'application/json']), [
      'application/json',
      'text/html',
    ]);
  });

  specify('should keep order of available media types on a tie', function () {
    assert.deepEqual(negotiate('*/*', ['text/html', 'application/json']), [
      'text/html',
      'application/json',
    ]);
  });

  specify('should treat missing Accept as any media type', function () {
    assert.deepEqual(negotiate(undefined, ['text/html', 'application/json']), [
      'text/html',
      'application/json',
    ]);
  });

  specify('should recover valid elements from invalid Accept field value', function () {
    assert.deepEqual(
      negotiate('text/html;level, application/json;q=0.5, image/*;q=abc', [
        'text/html',
        'image/png',
        'application/json',
      ]),
      ['application/json'],
    );
  });

  specify('should not split Accept elements on commas inside quoted-strings', function () {
    assert.deepEqual(
      negotiate('text/html;foo="a,b";q=0.1, text/plain;level, application/json', [
        'text/html;foo="a,b"',
        'application/json',
      ]),
      ['application/json', 'text/html;foo="a,b"'],
    );
  });

  specify('should treat Accept without usable elements as no preference', function () {
    assert.deepEqual(negotiate('garbage', ['text/html', 'application/json']), [
      'text/html',
      'application/json',
    ]);
    assert.deepEqual(negotiate('', ['text/html']), ['text/html']);
  });

  specify('should omit invalid media types', function () {
    assert.deepEqual(negotiate('*/*', ['boom', 'text/html']), ['text/html']);
    assert.deepEqual(negotiate(undefined, ['boom', 'text/html']), ['text/html']);
  });

  specify('should throw TypeError on input of wrong type', function () {
    assert.throws(() => negotiate(1, ['text/html']), TypeError);
    assert.throws(() => negotiate('*/*', [null]), TypeError);
  });

  specify('should treat null Accept as missing Accept field', function () {
    assert.deepEqual(negotiate(null, ['text/html', 'application/json']), [
      'text/html',
      'application/json',
    ]);
  });

  specify('should throw TypeError when media types are not an iterable of values', function () {
    assert.throws(() => negotiate('*/*', 'text/html'), TypeError);
    assert.throws(() => negotiate('*/*', null), TypeError);
    assert.throws(() => negotiate('*/*', undefined), TypeError);
    assert.throws(() => negotiate('*/*', 1), TypeError);
  });

  context('given malformed Accept field value', function () {
    specify('should treat double quote outside of parameter value as literal', function () {
      assert.deepEqual(negotiate('foo"bar, application/json;q=0', ['application/json']), []);
    });

    specify('should treat unterminated quoted-string as literal', function () {
      assert.deepEqual(negotiate('text/html;a="x, image/png;q=0', ['image/png']), []);
      assert.deepEqual(negotiate('text/html;a="x, image/png;q=0.5', ['image/png']), ['image/png']);
    });

    specify('should process long whitespace runs in linear time', function () {
      const accept = `a${' '.repeat(256 * 1024)}a, text/html`;
      const start = Date.now();

      assert.deepEqual(negotiate(accept, ['text/html']), ['text/html']);
      assert.isBelow(Date.now() - start, 1000);
    });

    specify('should process many unterminated quoted-strings in linear time', function () {
      const accept = `${'a="'.repeat(64 * 1024)}, text/html`;
      const start = Date.now();

      assert.deepEqual(negotiate(accept, ['text/html']), ['text/html']);
      assert.isBelow(Date.now() - start, 1000);
    });
  });
});
