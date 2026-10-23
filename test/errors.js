import { assert } from 'chai';

import { MediaTypeError, MediaTypeParseError } from '../src/index.js';

describe('errors', function () {
  specify('should have explicit names', function () {
    assert.strictEqual(MediaTypeError.name, 'MediaTypeError');
    assert.strictEqual(MediaTypeParseError.name, 'MediaTypeParseError');
    assert.strictEqual(new MediaTypeError('message').name, 'MediaTypeError');
    assert.strictEqual(new MediaTypeParseError('message').name, 'MediaTypeParseError');
  });

  specify('should name instances of subclasses after the subclass', function () {
    class CustomError extends MediaTypeParseError {}

    assert.strictEqual(new CustomError('message').name, 'CustomError');
  });

  specify('should keep cause and additional properties', function () {
    const cause = new Error('cause');
    const error = new MediaTypeParseError('message', { cause, source: 'text', type: 'media-type' });

    assert.instanceOf(error, MediaTypeError);
    assert.strictEqual(error.cause, cause);
    assert.strictEqual(error.source, 'text');
    assert.strictEqual(error.type, 'media-type');
  });
});
