import { assert } from 'chai';

import { testMediaType } from '../../src/index.js';

describe('testMediaType', function () {
  specify('should detect valid media types', function () {
    assert.isTrue(testMediaType('text/html'));
    assert.isTrue(testMediaType('application/vnd.api+json; charset=utf-8'));
    assert.isTrue(testMediaType('multipart/form-data; boundary="----abc def"'));
  });

  specify('should detect invalid media types', function () {
    assert.isFalse(testMediaType(''));
    assert.isFalse(testMediaType('text'));
    assert.isFalse(testMediaType('text/html '));
    assert.isFalse(testMediaType('text/html; charset'));
    assert.isFalse(testMediaType(1));
    assert.isFalse(testMediaType(null));
    assert.isFalse(testMediaType(undefined));
  });
});
