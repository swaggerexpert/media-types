import fs from 'node:fs';
import { assert } from 'chai';

import { negotiate } from '../../src/index.js';

/**
 * Media type negotiation tests from negotiator.
 * https://github.com/jshttp/negotiator/blob/dfb9facc44f1396517ffa229fb7d04f2e14fbff4/test/mediaType.js
 *
 * Only tests providing a list of available media types are applicable.
 */
const tests = JSON.parse(
  fs.readFileSync(new URL('./fixtures/negotiator/media-type.json', import.meta.url)),
).filter((test) => typeof test === 'object' && test.available !== null);

describe('compliance', function () {
  context('negotiator', function () {
    tests.forEach(({ description, method, accept, available, expected }) => {
      const acceptValue = accept === null ? undefined : accept;

      specify(description, function () {
        const negotiated = negotiate(acceptValue, available);

        if (method === 'mediaType') {
          assert.strictEqual(negotiated[0], expected === null ? undefined : expected);
        } else {
          assert.deepEqual(negotiated, expected);
        }
      });
    });
  });
});
