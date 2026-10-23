import parse from '../parse/index.js';

const testMediaRange = (source) => {
  try {
    const parseResult = parse(source, { type: 'media-range', translator: null });
    return parseResult.result.success;
  } catch {
    return false;
  }
};

export default testMediaRange;
