import { assert } from 'chai';

import { parse } from '../../src/index.js';

describe('parse', function () {
  context('media-type', function () {
    const parseMediaType = (source) => parse(source, { type: 'media-type' });

    context('given valid source string', function () {
      context('text/html', function () {
        specify('should parse', function () {
          const parseResult = parseMediaType('text/html');

          assert.isTrue(parseResult.result.success);
          assert.deepEqual(parseResult.tree, { type: 'text', subtype: 'html', parameters: {} });
        });
      });

      context('text/html;charset=utf-8', function () {
        specify('should parse', function () {
          const parseResult = parseMediaType('text/html;charset=utf-8');

          assert.isTrue(parseResult.result.success);
          assert.deepEqual(parseResult.tree, {
            type: 'text',
            subtype: 'html',
            parameters: { charset: 'utf-8' },
          });
        });
      });

      context('equivalent forms from RFC 9110', function () {
        // https://www.rfc-editor.org/rfc/rfc9110#section-8.3.1
        [
          'text/html;charset=utf-8',
          'Text/HTML;Charset="utf-8"',
          'text/html; charset="utf-8"',
          'text/html;charset=UTF-8',
        ].forEach((source) => {
          specify(`should parse ${source}`, function () {
            const parseResult = parseMediaType(source);

            assert.isTrue(parseResult.result.success);
            assert.strictEqual(parseResult.tree.type, 'text');
            assert.strictEqual(parseResult.tree.subtype, 'html');
            assert.strictEqual(parseResult.tree.parameters.charset.toLowerCase(), 'utf-8');
          });
        });
      });

      context('application/vnd.api+json', function () {
        specify('should parse structured syntax suffix', function () {
          const parseResult = parseMediaType('application/vnd.api+json');

          assert.isTrue(parseResult.result.success);
          assert.deepEqual(parseResult.tree, {
            type: 'application',
            subtype: 'vnd.api+json',
            suffix: 'json',
            parameters: {},
          });
        });
      });

      context('application/vnd.foo+cbor+json', function () {
        specify('should use the part after the last "+" as suffix', function () {
          const parseResult = parseMediaType('application/vnd.foo+cbor+json');

          assert.isTrue(parseResult.result.success);
          assert.strictEqual(parseResult.tree.suffix, 'json');
        });
      });

      context('application/+json and application/json+', function () {
        specify('should not produce suffix', function () {
          assert.notProperty(parseMediaType('application/+json').tree, 'suffix');
          assert.notProperty(parseMediaType('application/json+').tree, 'suffix');
        });
      });

      context('TEXT/HTML;CHARSET=UTF-8', function () {
        specify('should lower case type, subtype and parameter names, but not values', function () {
          const parseResult = parseMediaType('TEXT/HTML;CHARSET=UTF-8');

          assert.isTrue(parseResult.result.success);
          assert.deepEqual(parseResult.tree, {
            type: 'text',
            subtype: 'html',
            parameters: { charset: 'UTF-8' },
          });
        });
      });

      context('text/plain; a=1 ;b=2\t;\tc=3', function () {
        specify('should allow optional whitespace around ";"', function () {
          const parseResult = parseMediaType('text/plain; a=1 ;b=2\t;\tc=3');

          assert.isTrue(parseResult.result.success);
          assert.deepEqual(parseResult.tree.parameters, { a: '1', b: '2', c: '3' });
        });
      });

      context('text/plain;;a=1;', function () {
        specify('should allow empty parameters', function () {
          const parseResult = parseMediaType('text/plain;;a=1;');

          assert.isTrue(parseResult.result.success);
          assert.deepEqual(parseResult.tree.parameters, { a: '1' });
        });
      });

      context('text/html; and text/html; ', function () {
        specify('should allow trailing ";" as parameters are optional', function () {
          // https://www.rfc-editor.org/rfc/rfc9110#section-5.6.6
          assert.isTrue(parseMediaType('text/html;').result.success);
          assert.isTrue(parseMediaType('text/html; ').result.success);
          assert.deepEqual(parseMediaType('text/html; ').tree.parameters, {});
        });
      });

      context('quoted-string parameter value', function () {
        specify('should unquote and resolve quoted-pairs', function () {
          const parseResult = parseMediaType(
            'text/plain;title="a \\"quoted\\" \\\\ value; with=chars"',
          );

          assert.isTrue(parseResult.result.success);
          assert.deepEqual(parseResult.tree.parameters, {
            title: 'a "quoted" \\ value; with=chars',
          });
        });

        specify('should allow empty quoted-string', function () {
          const parseResult = parseMediaType('text/plain;a=""');

          assert.isTrue(parseResult.result.success);
          assert.deepEqual(parseResult.tree.parameters, { a: '' });
        });

        specify('should allow obs-text', function () {
          const parseResult = parseMediaType('text/plain;a="café"');

          assert.isTrue(parseResult.result.success);
          assert.deepEqual(parseResult.tree.parameters, { a: 'café' });
        });
      });

      context('duplicate parameters', function () {
        specify('should keep the first occurrence', function () {
          const parseResult = parseMediaType('text/html;charset=a;CHARSET=b');

          assert.isTrue(parseResult.result.success);
          assert.deepEqual(parseResult.tree.parameters, { charset: 'a' });
        });
      });

      context('__proto__ parameter', function () {
        specify('should be an own property and not pollute the prototype', function () {
          const parseResult = parseMediaType('text/html;__proto__=x;constructor=y');

          assert.isTrue(parseResult.result.success);
          assert.isTrue(
            Object.prototype.hasOwnProperty.call(parseResult.tree.parameters, '__proto__'),
          );
          assert.strictEqual(parseResult.tree.parameters.constructor, 'y');
          assert.strictEqual(Object.getPrototypeOf(parseResult.tree.parameters), Object.prototype);
          assert.strictEqual(parseResult.tree.parameters.__proto__, 'x');
          assert.strictEqual(Object.getPrototypeOf({}), Object.prototype);
          assert.isUndefined(Object.prototype.x);
        });
      });

      context('*/*', function () {
        specify('should parse as "*" is a tchar', function () {
          const parseResult = parseMediaType('*/*');

          assert.isTrue(parseResult.result.success);
          assert.deepEqual(parseResult.tree, { type: '*', subtype: '*', parameters: {} });
        });
      });
    });

    context('given invalid source string', function () {
      [
        '',
        'text',
        'text/',
        '/html',
        'text/html/x',
        ' text/html',
        'text/html ',
        'text /html',
        'text/ html',
        'text/html;charset',
        'text/html;charset=',
        'text/html;charset =utf-8',
        'text/html;charset= utf-8',
        'text/html;charset="utf-8',
        'text/html;charset="a"b',
        'text/html;charset=a b',
        'text/html, application/json',
        'text/ht(ml',
        'text/html;a="Ā"',
        'text/html;a="\u0000"',
        'text/html;a="\\\u0000"',
        'téxt/html',
      ].forEach((source) => {
        specify(`should fail parsing ${JSON.stringify(source)}`, function () {
          const parseResult = parseMediaType(source);

          assert.isFalse(parseResult.result.success);
          assert.isUndefined(parseResult.tree);
        });
      });
    });

    context('given non-string input', function () {
      specify('should throw error', function () {
        assert.throws(() => parseMediaType([]), TypeError);
        assert.throws(() => parseMediaType(1), TypeError);
        assert.throws(() => parseMediaType(null), TypeError);
        assert.throws(() => parseMediaType(undefined), TypeError);
      });
    });
  });
});
