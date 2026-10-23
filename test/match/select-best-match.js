import { assert } from 'chai';

import { selectBestMatch, parse } from '../../src/index.js';

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

  specify('should throw TypeError when media ranges are not an iterable of values', function () {
    assert.throws(() => selectBestMatch('application/json', 'application/json'), TypeError);
    assert.throws(() => selectBestMatch(null, 'application/json'), TypeError);
    assert.throws(() => selectBestMatch(1, 'application/json'), TypeError);
  });

  specify('should throw TypeError for values that are not parsed media types', function () {
    // parse result instead of its tree
    assert.throws(() => selectBestMatch(['*/*'], parse('text/html')), TypeError);
    // parsed Accept field value instead of media type
    assert.throws(
      () => selectBestMatch(['*/*'], parse('text/html', { type: 'accept' }).tree),
      TypeError,
    );
    assert.throws(() => selectBestMatch([{ type: '*', subtype: '*' }], 'text/html'), TypeError);
  });

  context('given compatible parameters', function () {
    // https://github.com/swaggerexpert/media-types/issues/6
    const options = { parameterMatching: 'compatible' };
    const cases = [
      ['application/json; charset=utf-8', ['application/json'], 'application/json'],
      ['application/json', ['application/json; charset=utf-8'], 'application/json; charset=utf-8'],
      [
        'application/json; charset=utf-8',
        ['application/json; charset=UTF-8'],
        'application/json; charset=UTF-8',
      ],
      [
        'application/vnd.x; version=2',
        ['application/vnd.x; version=1', 'application/vnd.x; version=2'],
        'application/vnd.x; version=2',
      ],
      ['application/vnd.x; version=2', ['application/vnd.x; version=1'], null],
      [
        'application/json',
        ['application/json; charset=utf-8', '*/*'],
        'application/json; charset=utf-8',
      ],
      [
        'application/json',
        ['application/json; charset=utf-8', 'application/json'],
        'application/json',
      ],
      [
        'application/json',
        ['application/json', 'application/json; charset=utf-8'],
        'application/json',
      ],
      ['text/plain; charset=iso-8859-1', ['text/plain; charset=utf-8', 'text/*'], 'text/*'],
      ['application/json; charset=utf-16', ['application/json; charset=utf-8'], null],
      [
        'application/json; a=1',
        ['application/json; b=2', 'application/json; a=1; c=3'],
        'application/json; a=1; c=3',
      ],
      [
        'application/json; charset=utf-8',
        ['application/json', 'application/json; charset=utf-8'],
        'application/json; charset=utf-8',
      ],
    ];

    cases.forEach(([mediaType, mediaRanges, expected]) => {
      specify(
        `should select ${JSON.stringify(expected)} for ${JSON.stringify(mediaType)} from ${JSON.stringify(mediaRanges)}`,
        function () {
          assert.strictEqual(selectBestMatch(mediaRanges, mediaType, options), expected);
        },
      );
    });
  });

  context('given required parameters', function () {
    specify('should be the default', function () {
      const mediaRanges = ['application/json; charset=utf-8', '*/*'];

      assert.strictEqual(selectBestMatch(mediaRanges, 'application/json'), '*/*');
      assert.strictEqual(
        selectBestMatch(mediaRanges, 'application/json', { parameterMatching: 'required' }),
        '*/*',
      );
      assert.strictEqual(
        selectBestMatch(mediaRanges, 'application/json', { parameterMatching: null }),
        '*/*',
      );
      assert.strictEqual(selectBestMatch(mediaRanges, 'application/json', null), '*/*');
    });
  });

  specify('should throw TypeError for unknown parameterMatching option', function () {
    assert.throws(
      () => selectBestMatch(['*/*'], 'text/html', { parameterMatching: 'ignore' }),
      TypeError,
    );
    assert.throws(
      () => selectBestMatch(['*/*'], 'text/html', { parameterMatching: true }),
      TypeError,
    );
  });
});
