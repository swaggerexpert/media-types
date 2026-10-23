import { assert } from 'chai';

import { parse } from '../../src/index.js';

describe('parse', function () {
  context('media-range', function () {
    const parseRange = (source) => parse(source, { startRule: 'media-range' });

    context('*/*', function () {
      specify('should parse', function () {
        const parseResult = parseRange('*/*');

        assert.isTrue(parseResult.result.success);
        assert.deepEqual(parseResult.tree, { type: '*', subtype: '*', parameters: {} });
      });
    });

    context('text/*', function () {
      specify('should parse', function () {
        const parseResult = parseRange('text/*');

        assert.isTrue(parseResult.result.success);
        assert.deepEqual(parseResult.tree, { type: 'text', subtype: '*', parameters: {} });
      });
    });

    context('text/*;charset=utf-8', function () {
      specify('should parse', function () {
        const parseResult = parseRange('text/*;charset=utf-8');

        assert.isTrue(parseResult.result.success);
        assert.deepEqual(parseResult.tree, {
          type: 'text',
          subtype: '*',
          parameters: { charset: 'utf-8' },
        });
      });
    });

    context('application/*+json', function () {
      specify('should parse as ( type "/" subtype )', function () {
        const parseResult = parseRange('application/*+json');

        assert.isTrue(parseResult.result.success);
        assert.deepEqual(parseResult.tree, {
          type: 'application',
          subtype: '*+json',
          suffix: 'json',
          parameters: {},
        });
      });
    });

    context('*/*;level=1', function () {
      specify('should parse', function () {
        const parseResult = parseRange('*/*;level=1');

        assert.isTrue(parseResult.result.success);
        assert.deepEqual(parseResult.tree.parameters, { level: '1' });
      });
    });

    context('given invalid source string', function () {
      ['', '*', '*/', 'text/*,', 'text/* '].forEach((source) => {
        specify(`should fail parsing ${JSON.stringify(source)}`, function () {
          const parseResult = parseRange(source);

          assert.isFalse(parseResult.result.success);
          assert.isUndefined(parseResult.tree);
        });
      });
    });
  });
});
