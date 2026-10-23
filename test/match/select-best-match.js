import { assert } from 'chai';

import { selectBestMatch } from '../../src/index.js';

describe('selectBestMatch', function () {
  const mediaRanges = [
    '*/*',
    'application/*',
    'application/json',
    'application/json; charset=utf-8',
  ];

  specify('should select the most specific matching media range', function () {
    assert.strictEqual(
      selectBestMatch(mediaRanges, 'application/json;charset=UTF-8'),
      'application/json; charset=utf-8',
    );
    assert.strictEqual(selectBestMatch(mediaRanges, 'application/json'), 'application/json');
    assert.strictEqual(selectBestMatch(mediaRanges, 'application/xml'), 'application/*');
    assert.strictEqual(selectBestMatch(mediaRanges, 'text/plain'), '*/*');
  });

  specify('should prefer the first media range on equal specificity', function () {
    assert.strictEqual(selectBestMatch(['text/html', 'TEXT/HTML'], 'text/html'), 'text/html');
  });

  specify('should return null when nothing matches', function () {
    assert.isNull(selectBestMatch(['text/*'], 'application/json'));
    assert.isNull(selectBestMatch([], 'application/json'));
  });

  specify('should skip invalid media ranges', function () {
    assert.strictEqual(
      selectBestMatch(
        ['application/json; charset', 'garbage', 'application/*'],
        'application/json',
      ),
      'application/*',
    );
  });

  specify('should return null for invalid media type', function () {
    assert.isNull(selectBestMatch(['*/*'], 'garbage'));
  });

  specify('should accept any iterable', function () {
    assert.strictEqual(selectBestMatch(new Set(['text/*']), 'text/html'), 'text/*');
  });
});
