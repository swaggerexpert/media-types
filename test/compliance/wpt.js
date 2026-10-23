import fs from 'node:fs';
import { assert } from 'chai';

import { parse } from '../../src/index.js';

/**
 * MIME type parsing tests from web-platform-tests.
 * https://github.com/web-platform-tests/wpt/tree/0f195499f06d0833e768b01a1a8ce942b8622fc8/mimesniff/mime-types
 *
 * The tests are written for the WHATWG MIME Sniffing parsing algorithm, which recovers from
 * syntax errors that RFC 9110 does not allow. Every input accepted by RFC 9110 grammar must
 * produce the same MIME type record as the WHATWG algorithm. Inputs rejected by
 * the WHATWG algorithm must be rejected by RFC 9110 grammar as well.
 */
const loadFixture = (name) =>
  JSON.parse(fs.readFileSync(new URL(`./fixtures/wpt/${name}`, import.meta.url))).filter(
    (test) => typeof test === 'object',
  );

const isToken = (value) => /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(value);

/**
 * https://mimesniff.spec.whatwg.org/#serializing-a-mime-type
 */
const serialize = ({ type, subtype, parameters }) => {
  const serializedParameters = Object.entries(parameters).map(([name, value]) => {
    const serializedValue = isToken(value) ? value : `"${value.replace(/(["\\])/g, '\\$1')}"`;
    return `;${name}=${serializedValue}`;
  });

  return `${type}/${subtype}${serializedParameters.join('')}`;
};

const parseAndSerialize = (input) => {
  const parseResult = parse(input, { type: 'media-type' });
  return parseResult.result.success ? serialize(parseResult.tree) : null;
};

/**
 * Inputs the WHATWG algorithm recovers from, but are not valid according to RFC 9110.
 */
const rfc9110Invalid = new Set([
  'text/html;charset=gbk(',
  'text/html;x=(;charset=gbk',
  'text/html;charset=();charset=GBK',
  'text/html;charset =gbk',
  'text/html;charset= gbk',
  'text/html;charset= "gbk"',
  'text/html;charset=\u000Bgbk',
  'text/html;charset=\u000Cgbk',
  'text/html;\u000Bcharset=gbk',
  'text/html;\u000Ccharset=gbk',
  'text/html;test;charset=gbk',
  'text/html;test=;charset=gbk',
  "text/html;';charset=gbk",
  'text/html;";charset=gbk',
  'text/html;charset= "\u007F;charset=GBK',
  'text/html;charset="\u007F;charset=foo";charset=GBK',
  'text/html;charset="gbk',
  'text/html;charset=gbk"',
  'text/html;charset="gbk"x',
  'text/html;charset=";charset=GBK',
  'text/html;charset={gbk}',
  'text/html;a]=bar;b[=bar;c=bar',
  'text/html;in]valid=";asd=foo";foo=bar',
  'x/x\n\r\t ;x=x',
  '\n\r\t x/x;x=x\n\r\t ',
  'text/html;test=\u00FF;charset=gbk',
  'x/x;test',
  'x/x;test="\\',
  'x/x;x= ',
  'x/x;x=\t',
  'x/x;\n\r\t x=x\n\r\t ;x=y',
  'x/x;test=\uFFFD;x=x',
]);

describe('compliance', function () {
  context('web-platform-tests', function () {
    context('mime-types.json', function () {
      loadFixture('mime-types.json').forEach(({ input, output }) => {
        if (rfc9110Invalid.has(input)) {
          specify(`should reject ${JSON.stringify(input)}`, function () {
            assert.isNotNull(output);
            assert.isNull(parseAndSerialize(input));
          });
        } else {
          specify(
            `should parse ${JSON.stringify(input)} as ${JSON.stringify(output)}`,
            function () {
              assert.strictEqual(parseAndSerialize(input), output);
            },
          );
        }
      });
    });

    context('generated-mime-types.json', function () {
      // https://github.com/web-platform-tests/wpt/blob/0f195499f06d0833e768b01a1a8ce942b8622fc8/mimesniff/mime-types/resources/generated-mime-types.py
      // Every case places a single non-token code point into a type, subtype, parameter name,
      // unquoted parameter value or quoted parameter value. Validity is derived from RFC 9110:
      // only a quoted parameter value can contain such code point, when it is qdtext.
      // https://www.rfc-editor.org/rfc/rfc9110#section-5.6.4
      const isQdtext = (code) =>
        code === 0x09 ||
        code === 0x20 ||
        code === 0x21 ||
        (code >= 0x23 && code <= 0x5b) ||
        (code >= 0x5d && code <= 0x7e) ||
        (code >= 0x80 && code <= 0xff);

      const scenarios = [
        {
          name: 'quoted parameter value',
          pattern: /^x\/x;x="([\s\S])";bonus=x$/,
          isValid: isQdtext,
        },
        { name: 'parameter value', pattern: /^x\/x;x=([\s\S]);bonus=x$/, isValid: () => false },
        { name: 'parameter name', pattern: /^x\/x;([\s\S])=x;bonus=x$/, isValid: () => false },
        { name: 'subtype', pattern: /^x\/([\s\S])$/, isValid: () => false },
        { name: 'type', pattern: /^([\s\S])\/x$/, isValid: () => false },
      ];

      loadFixture('generated-mime-types.json').forEach(({ input, output }) => {
        const scenario = scenarios.find(({ pattern }) => pattern.test(input));

        specify(`should handle ${JSON.stringify(input)}`, function () {
          assert.isDefined(scenario, 'unknown generated case');

          const code = scenario.pattern.exec(input)[1].charCodeAt(0);
          const isTypeScenario = scenario.name === 'type' || scenario.name === 'subtype';

          // WHATWG rejects invalid types and subtypes, and recovers from invalid parameters
          assert.strictEqual(output === null, isTypeScenario, 'unexpected WHATWG output');

          if (scenario.isValid(code)) {
            assert.strictEqual(parseAndSerialize(input), output);
          } else {
            assert.isNull(parseAndSerialize(input));
          }
        });
      });
    });
  });
});
