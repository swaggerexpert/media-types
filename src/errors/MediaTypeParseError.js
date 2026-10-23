import MediaTypeError from './MediaTypeError.js';

class MediaTypeParseError extends MediaTypeError {}

Object.defineProperty(MediaTypeParseError, 'name', { value: 'MediaTypeParseError' });

export default MediaTypeParseError;
