import { assert } from 'chai';

import { parse, XMLTranslator } from '../../../src/index.js';

describe('parse', function () {
  context('translators', function () {
    context('XMLTranslator', function () {
      specify('should translate a media type to a XML', function () {
        const parseResult = parse('a/b', { translator: new XMLTranslator() });

        assert.isTrue(parseResult.result.success);
        assert.strictEqual(
          parseResult.tree,
          '<?xml version="1.0" encoding="utf-8"?>\n' +
            '<root nodes="4" characters="3">\n' +
            '<!-- input string -->\n' +
            '  a/b\n' +
            ' <node name="media-type" index="0" length="3">\n' +
            '   a/b\n' +
            '  <node name="type" index="0" length="1">\n' +
            '    a\n' +
            '  </node><!-- name="type" -->\n' +
            '  <node name="subtype" index="2" length="1">\n' +
            '    b\n' +
            '  </node><!-- name="subtype" -->\n' +
            '  <node name="parameters" index="3" length="0">\n' +
            '    \n' +
            '  </node><!-- name="parameters" -->\n' +
            ' </node><!-- name="media-type" -->\n' +
            '</root>\n',
        );
      });
    });
  });

  specify('should escape XML special characters', function () {
    const { tree } = parse('text/html;a="</node><x>&\\"\'"', {
      type: 'media-type',
      translator: new XMLTranslator(),
    });

    assert.include(tree, '&lt;/node&gt;&lt;x&gt;&amp;');
    assert.notInclude(tree, '</node><x>');
    assert.notMatch(tree, /&(?!amp;|lt;|gt;|quot;|apos;)/);
  });
});
