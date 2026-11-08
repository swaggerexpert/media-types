import { assert } from 'chai';

import { matches, selectBestMatch, quality, negotiate, parse } from '../../src/index.js';
import {
  cache,
  cacheKey,
  CACHE_MAX_ENTRIES,
  CACHE_MAX_STRING_LENGTH,
  INVALID,
} from '../../src/match/utils.js';

describe('matching of repeatedly used strings', function () {
  beforeEach(function () {
    cache.clear();
  });

  specify('should keep frozen ASTs of matched strings', function () {
    assert.isTrue(matches('text/html', 'Text/HTML; charset=utf-8'));

    const mediaRange = cache.get(cacheKey('text/html', 'media-range'));
    const mediaType = cache.get(cacheKey('Text/HTML; charset=utf-8', 'media-type'));

    assert.deepInclude(mediaRange, { type: 'text', subtype: 'html' });
    assert.isTrue(Object.isFrozen(mediaRange));
    assert.isTrue(Object.isFrozen(mediaType.parameters));
    assert.isTrue(matches('text/html', 'Text/HTML; charset=utf-8'));
  });

  specify('should keep invalid strings as invalid', function () {
    assert.isFalse(matches('text/html', 'not a media type'));
    assert.strictEqual(cache.get(cacheKey('not a media type', 'media-type')), INVALID);
    assert.isFalse(matches('text/html', 'not a media type'));
  });

  specify('should keep a string separately for each type', function () {
    assert.strictEqual(quality('text/*;q=0.5', 'text/html'), 0.5);
    assert.isTrue(matches('text/*;q=0.5', 'text/html'));

    assert.isArray(cache.get(cacheKey('text/*;q=0.5', 'accept')));
    assert.deepInclude(cache.get(cacheKey('text/*;q=0.5', 'media-range')), { subtype: '*' });
  });

  specify('should drop the least recently used strings first', function () {
    // a parsed media range isn't kept, so only the media types fill the cache
    const anyMediaRange = parse('*/*', { type: 'media-range' }).tree;
    const mediaTypes = Array.from(
      { length: CACHE_MAX_ENTRIES },
      (_, i) => `application/vnd.x${i}+json`,
    );
    mediaTypes.forEach((mediaType) => matches(anyMediaRange, mediaType));
    // using the first string makes the second one the least recently used
    matches(anyMediaRange, mediaTypes[0]);
    matches(anyMediaRange, 'application/vnd.new+json');

    assert.isAtMost(cache.size, CACHE_MAX_ENTRIES);
    assert.isTrue(cache.has(cacheKey(mediaTypes[0], 'media-type')));
    assert.isFalse(cache.has(cacheKey(mediaTypes[1], 'media-type')));
    assert.isTrue(cache.has(cacheKey('application/vnd.new+json', 'media-type')));
  });

  specify('should keep at most the limit of strings', function () {
    for (let i = 0; i < CACHE_MAX_ENTRIES * 3; i += 1) matches('*/*', `application/vnd.x${i}+json`);

    assert.strictEqual(cache.size, CACHE_MAX_ENTRIES);
  });

  specify('should not keep strings longer than the limit', function () {
    const atLimit = `text/plain;x=${'a'.repeat(CACHE_MAX_STRING_LENGTH - 'text/plain;x='.length)}`;
    const overLimit = `${atLimit}a`;

    assert.isTrue(matches('text/plain', atLimit));
    assert.isTrue(matches('text/plain', overLimit));
    assert.isTrue(cache.has(cacheKey(atLimit, 'media-type')));
    assert.isFalse(cache.has(cacheKey(overLimit, 'media-type')));
  });

  specify('should not keep elements of a recovered Accept field value', function () {
    const accept = 'text/html;q=0.5, garbage, application/json';

    assert.deepEqual(negotiate(accept, ['application/json', 'text/html']), [
      'application/json',
      'text/html',
    ]);
    assert.strictEqual(cache.get(cacheKey(accept, 'accept')), INVALID);
    assert.isFalse(cache.has(cacheKey('application/json', 'accept')));
    assert.deepEqual(negotiate(accept, ['application/json', 'text/html']), [
      'application/json',
      'text/html',
    ]);
  });

  specify('should return the values passed in, not the kept ASTs', function () {
    const mediaRanges = ['text/*', 'text/html'];

    assert.strictEqual(selectBestMatch(mediaRanges, 'text/html'), mediaRanges[1]);
    assert.strictEqual(selectBestMatch(mediaRanges, 'text/html'), mediaRanges[1]);
  });

  specify('should not freeze results of parse or parsed values passed in', function () {
    matches('text/html', 'text/html');
    const { tree } = parse('text/html', { type: 'media-type' });

    assert.isFalse(Object.isFrozen(tree));
    assert.isTrue(matches('text/html', tree));
    assert.isFalse(Object.isFrozen(tree));
    assert.isFalse(cache.has(cacheKey(tree, 'media-type')));
  });
});
