import { assert } from 'chai';

import { parse, CSTTranslator } from '../../../src/index.js';

describe('parse', function () {
  context('translators', function () {
    context('CSTTranslator', function () {
      specify('should translate a media type to a CST', function () {
        const parseResult = parse('Text/HTML;a="b"', { translator: new CSTTranslator() });

        assert.isTrue(parseResult.result.success);
        assert.deepEqual(parseResult.tree, {
          root: {
            type: 'media-type',
            text: 'Text/HTML;a="b"',
            start: 0,
            length: 15,
            children: [
              { type: 'type', text: 'Text', start: 0, length: 4, children: [] },
              { type: 'subtype', text: 'HTML', start: 5, length: 4, children: [] },
              {
                type: 'parameters',
                text: ';a="b"',
                start: 9,
                length: 6,
                children: [
                  {
                    type: 'parameter',
                    text: 'a="b"',
                    start: 10,
                    length: 5,
                    children: [
                      { type: 'parameter-name', text: 'a', start: 10, length: 1, children: [] },
                      { type: 'parameter-value', text: '"b"', start: 12, length: 3, children: [] },
                    ],
                  },
                ],
              },
            ],
          },
        });
      });

      specify('should translate an Accept field value to a CST', function () {
        const parseResult = parse('*/*;q=0', {
          startRule: 'Accept',
          translator: new CSTTranslator(),
        });

        assert.isTrue(parseResult.result.success);
        assert.strictEqual(parseResult.tree.root.type, 'Accept');
        assert.deepEqual(
          parseResult.tree.root.children.map(({ type }) => type),
          ['media-range'],
        );
      });
    });
  });
});
