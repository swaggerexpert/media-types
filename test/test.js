import { assert } from 'chai';

import { test, parse, identify } from '../src/index.js';

describe('test', function () {
  context('given no type', function () {
    specify('should detect sources valid as any type', function () {
      assert.isTrue(test('text/html'));
      assert.isTrue(test('application/vnd.api+json; charset=utf-8'));
      assert.isTrue(test('multipart/form-data; boundary="----abc def"'));
      assert.isTrue(test('text/*'));
      assert.isTrue(test('*/*'));
      assert.isTrue(test('text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8'));
    });

    specify('should detect invalid sources', function () {
      assert.isFalse(test(''));
      assert.isFalse(test(', ,'));
      assert.isFalse(test('text'));
      assert.isFalse(test('text/html '));
      assert.isFalse(test('text/html; charset'));
      assert.isFalse(test('text/html; charset =utf-8'));
    });
  });

  context('given media-type type', function () {
    specify('should detect valid media types', function () {
      assert.isTrue(test('text/html', { type: 'media-type' }));
      assert.isTrue(test('text/html;q=0.5', { type: 'media-type' }));
    });

    specify('should detect invalid media types', function () {
      assert.isFalse(test('', { type: 'media-type' }));
      assert.isFalse(test('text/html, */*', { type: 'media-type' }));
    });
  });

  context('given media-range type', function () {
    specify('should detect valid media ranges', function () {
      assert.isTrue(test('*/*', { type: 'media-range' }));
      assert.isTrue(test('text/*', { type: 'media-range' }));
      assert.isTrue(test('text/html;level=1', { type: 'media-range' }));
    });

    specify('should detect invalid media ranges', function () {
      assert.isFalse(test('*', { type: 'media-range' }));
      assert.isFalse(test('text/*, */*', { type: 'media-range' }));
    });
  });

  context('given accept type', function () {
    specify('should detect valid Accept field values', function () {
      assert.isTrue(test('', { type: 'accept' }));
      assert.isTrue(test('*/*', { type: 'accept' }));
      assert.isTrue(test('text/html, */*;q=0.8', { type: 'accept' }));
    });

    specify('should detect invalid Accept field values', function () {
      assert.isFalse(test('text', { type: 'accept' }));
      assert.isFalse(test('text/html;q', { type: 'accept' }));
    });
  });

  specify('should be equivalent to the success of parsing', function () {
    ['text/html', 'text/*', 'a, b', '', 'text/html, */*', 'garbage'].forEach((source) => {
      [undefined, null, 'media-type', 'media-range', 'accept'].forEach((type) => {
        assert.strictEqual(test(source, { type }), parse(source, { type }).result.success);
      });
    });
  });

  specify('should treat null type as no type', function () {
    assert.isTrue(test('text/html, */*', { type: null }));
    assert.isFalse(test('', { type: null }));
  });

  specify('should use defaults for null options', function () {
    assert.isTrue(test('text/html', null));
    assert.isFalse(test('garbage', null));
  });

  specify('should be equivalent to testing with identified type', function () {
    ['text/html', 'text/*', 'text/html, */*', 'garbage', ''].forEach((source) => {
      assert.strictEqual(test(source, { type: identify(source) }), test(source));
    });
  });

  specify('should return false for non-string sources', function () {
    assert.isFalse(test(1));
    assert.isFalse(test(null));
    assert.isFalse(test(undefined));
    assert.isFalse(test({}, { type: 'accept' }));
  });

  specify('should throw TypeError for unknown type', function () {
    assert.throws(() => test('text/html', { type: 'Accept' }), TypeError);
    assert.throws(() => test('text/html', { type: ['accept'] }), TypeError);
  });
});
