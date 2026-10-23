import { assert } from 'chai';

import { testAccept } from '../../src/index.js';

describe('testAccept', function () {
  specify('should detect valid Accept field values', function () {
    assert.isTrue(testAccept(''));
    assert.isTrue(testAccept('*/*'));
    assert.isTrue(testAccept('text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8'));
  });

  specify('should detect invalid Accept field values', function () {
    assert.isFalse(testAccept('text'));
    assert.isFalse(testAccept('text/html;q'));
    assert.isFalse(testAccept(undefined));
  });
});
