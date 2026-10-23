import { assert } from 'chai';

import { negotiate, MediaTypeParseError } from '../../src/index.js';

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

  specify('should throw on invalid Accept field value', function () {
    assert.throws(() => negotiate('text', ['text/html']), MediaTypeParseError);
  });
});
