import { assert } from 'chai';

import { matches, parse } from '../../src/index.js';

describe('matches', function () {
  specify('should match by */*', function () {
    assert.isTrue(matches('*/*', 'text/html'));
    assert.isTrue(matches('*/*', 'application/vnd.api+json;charset=utf-8'));
  });

  specify('should match by type/*', function () {
    assert.isTrue(matches('text/*', 'text/html'));
    assert.isTrue(matches('TEXT/*', 'text/HTML'));
    assert.isFalse(matches('text/*', 'application/json'));
  });

  specify('should match by type/subtype', function () {
    assert.isTrue(matches('text/html', 'Text/Html'));
    assert.isFalse(matches('text/html', 'text/plain'));
    assert.isFalse(matches('application/json', 'application/vnd.api+json'));
  });

  specify('should not treat "*" type as wildcard unless subtype is "*" too', function () {
    assert.isFalse(matches('*/html', 'text/html'));
  });

  specify('should require all media range parameters to match', function () {
    assert.isTrue(matches('text/plain', 'text/plain;format=flowed'));
    assert.isTrue(matches('text/plain;format=flowed', 'text/plain;format=flowed;charset=utf-8'));
    assert.isFalse(matches('text/plain;format=flowed', 'text/plain'));
    assert.isFalse(matches('text/plain;format=flowed', 'text/plain;format=fixed'));
    assert.isFalse(matches('text/plain;format=flowed', 'text/plain;format=Flowed'));
  });

  specify('should compare charset values case-insensitively', function () {
    assert.isTrue(matches('text/*;charset=utf-8', 'text/plain;charset="UTF-8"'));
  });

  specify('should accept already parsed values', function () {
    const mediaRange = parse('text/*', { type: 'media-range' }).tree;
    const mediaType = parse('text/html').tree;

    assert.isTrue(matches(mediaRange, mediaType));
  });

  specify('should not match invalid input', function () {
    assert.isFalse(matches('text', 'text/html'));
    assert.isFalse(matches('text/*', 'text/*,'));
    assert.isFalse(matches('*/*', 'garbage'));
  });

  specify('should throw TypeError on input of wrong type', function () {
    assert.throws(() => matches(1, 'text/html'), TypeError);
    assert.throws(() => matches('*/*', null), TypeError);
    assert.throws(() => matches(undefined, 'text/html'), TypeError);
  });

  specify('should throw TypeError for objects that are not parsed media types', function () {
    assert.throws(() => matches({}, 'text/html'), TypeError);
    assert.throws(() => matches('*/*', []), TypeError);
    assert.throws(
      () => matches('*/*', { type: 'text', subtype: 'html', parameters: null }),
      TypeError,
    );
  });
});
