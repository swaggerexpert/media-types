import { assert } from 'chai';

import { testMediaRange } from '../../src/index.js';

describe('testMediaRange', function () {
  specify('should detect valid media ranges', function () {
    assert.isTrue(testMediaRange('*/*'));
    assert.isTrue(testMediaRange('text/*'));
    assert.isTrue(testMediaRange('text/html;level=1'));
  });

  specify('should detect invalid media ranges', function () {
    assert.isFalse(testMediaRange('*'));
    assert.isFalse(testMediaRange('text/*, */*'));
    assert.isFalse(testMediaRange({}));
  });
});
