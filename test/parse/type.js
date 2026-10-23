import { assert } from 'chai';

import { parse } from '../../src/index.js';

describe('parse', function () {
  context('type', function () {
    context('given no type', function () {
      specify('should parse media type', function () {
        assert.deepEqual(parse('text/html;charset=utf-8').tree, {
          type: 'text',
          subtype: 'html',
          parameters: { charset: 'utf-8' },
        });
      });

      specify('should parse media range', function () {
        assert.deepEqual(parse('text/*').tree, { type: 'text', subtype: '*', parameters: {} });
      });

      specify('should parse Accept field value', function () {
        assert.deepEqual(parse('text/html, */*;q=0.1').tree, [
          { type: 'text', subtype: 'html', parameters: {}, weight: 1 },
          { type: '*', subtype: '*', parameters: {}, weight: 0.1 },
        ]);
        assert.deepEqual(parse('text/html;q=0.5').tree, [
          { type: 'text', subtype: 'html', parameters: {}, weight: 0.5 },
        ]);
      });

      specify('should parse unidentifiable source as media type', function () {
        const parseResult = parse('garbage', { trace: true });

        assert.isFalse(parseResult.result.success);
        assert.include(parseResult.trace.displayTrace(), '[RNM(media-type)]');
      });
    });

    context('given explicit type', function () {
      specify('should parse single media range as Accept field value', function () {
        assert.deepEqual(parse('text/html', { type: 'accept' }).tree, [
          { type: 'text', subtype: 'html', parameters: {}, weight: 1 },
        ]);
      });

      specify('should parse "q" as media type parameter', function () {
        assert.deepEqual(parse('text/html;q=0.5', { type: 'media-type' }).tree, {
          type: 'text',
          subtype: 'html',
          parameters: { q: '0.5' },
        });
      });

      specify('should parse empty Accept field value', function () {
        const parseResult = parse('', { type: 'accept' });

        assert.isTrue(parseResult.result.success);
        assert.deepEqual(parseResult.tree, []);
      });

      specify('should not fall back to other types', function () {
        assert.isFalse(parse('text/html, */*', { type: 'media-type' }).result.success);
      });
    });

    context('given null type', function () {
      specify('should identify the type', function () {
        assert.deepEqual(parse('text/*', { type: null }).tree, {
          type: 'text',
          subtype: '*',
          parameters: {},
        });
        assert.isFalse(parse('garbage', { type: null }).result.success);
      });
    });

    context('given unknown type', function () {
      specify('should throw TypeError', function () {
        assert.throws(() => parse('text/html', { type: 'Accept' }), TypeError);
        assert.throws(() => parse('text/html', { type: 'nope' }), TypeError);
      });
    });
  });
});
