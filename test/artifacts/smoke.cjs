/**
 * Smoke test of the built artifacts, as consumers load them: CommonJS, ES module, UMD (require and browser global).
 * Resolves the package by its name, so it runs both inside this repository (self-reference)
 * and in a project the packed tarball is installed into.
 * Written in syntax supported by the oldest supported Node.js version (see engines in package.json).
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const name = '@swaggerexpert/media-types';
const root = path.dirname(require.resolve(`${name}/package.json`));

// values created in a different realm (vm context) have different prototypes, so compare their JSON
const assertJSONEqual = (actual, expected) =>
  assert.strictEqual(JSON.stringify(actual), JSON.stringify(expected));

const check = (label, MediaTypes) => {
  const { tree } = MediaTypes.parse('Text/HTML; Charset="UTF-8"');
  assertJSONEqual(tree, { type: 'text', subtype: 'html', parameters: { charset: 'UTF-8' } });

  assert.strictEqual(MediaTypes.identify('text/*'), 'media-range');
  assert.strictEqual(MediaTypes.identify('garbage'), null);
  assert.strictEqual(MediaTypes.test('text/html, */*;q=0.1', { type: 'accept' }), true);
  assert.strictEqual(
    MediaTypes.selectBestMatch(['application/json; charset=utf-8', '*/*'], 'application/json', {
      parameterMatching: 'compatible',
    }),
    'application/json; charset=utf-8',
  );
  assertJSONEqual(
    MediaTypes.negotiate('text/*;q=0.5, application/json', ['text/html', 'application/json']),
    ['application/json', 'text/html'],
  );
  assert.strictEqual(MediaTypes.quality(null, 'text/html'), 1);

  const { trace } = MediaTypes.parse('text/', { trace: true });
  assert.ok(Array.from(trace.inferExpectations()).indexOf('a-z') !== -1);

  const error = new MediaTypes.MediaTypeParseError('message');
  assert.strictEqual(error.name, 'MediaTypeParseError');
  assert.ok(error instanceof MediaTypes.MediaTypeError);
  assert.strictEqual(new MediaTypes.MediaTypeError('message').name, 'MediaTypeError');

  assert.strictEqual(typeof new MediaTypes.Grammar().toString(), 'string');

  console.log(`ok ${label}`);
};

const main = async () => {
  check('CommonJS', require(name));
  check('ES module', await import(name));

  // UMD bundles target browsers (browser-production in .browserslistrc), Node.js >= 14 can require them
  if (Number(process.versions.node.split('.')[0]) < 14) {
    console.log('skip UMD bundles on Node.js < 14');
  } else {
    ['media-types.browser.js', 'media-types.browser.min.js'].forEach((file) => {
      const bundlePath = path.join(root, 'dist', file);

      check(`UMD require ${file}`, require(bundlePath));

      const context = {};
      context.self = context;
      vm.createContext(context);
      vm.runInContext(fs.readFileSync(bundlePath, 'utf8'), context);
      check(`UMD browser global ${file}`, context.MediaTypes);
    });
  }

  assert.ok(fs.readFileSync(require.resolve(`${name}/grammar.bnf`), 'utf8').length > 0);
  console.log('ok grammar.bnf');
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
