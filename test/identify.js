import { assert } from 'chai';

import { identify } from '../src/index.js';

describe('identify', function () {
  context('media type', function () {
    [
      'text/html',
      'TEXT/HTML; charset=utf-8',
      'application/vnd.api+json',
      '*/html',
      'text/*+json',
    ].forEach((source) => {
      specify(`should identify ${JSON.stringify(source)}`, function () {
        assert.strictEqual(identify(source), 'media-type');
      });
    });
  });

  context('media range', function () {
    ['*/*', 'text/*', 'TEXT/*;charset=utf-8'].forEach((source) => {
      specify(`should identify ${JSON.stringify(source)}`, function () {
        assert.strictEqual(identify(source), 'media-range');
      });
    });
  });

  context('Accept', function () {
    [
      'text/html, application/json',
      'text/html;q=0.5',
      'text/html;Q=1',
      'text/*;q=0.5',
      'text/html;q=abc',
      'text/html,',
      ', text/html',
      'audio/*; q=0.2, audio/basic',
    ].forEach((source) => {
      specify(`should identify ${JSON.stringify(source)}`, function () {
        assert.strictEqual(identify(source), 'accept');
      });
    });
  });

  context('not identifiable', function () {
    [
      '',
      ' ',
      ', ,',
      'garbage',
      'text/',
      'text/html; charset =utf-8',
      1,
      null,
      undefined,
      {},
    ].forEach((source) => {
      specify(`should not identify ${JSON.stringify(source)}`, function () {
        assert.isUndefined(identify(source));
      });
    });
  });
});
