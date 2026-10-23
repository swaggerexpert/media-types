import parse from '../parse/index.js';

const testMediaRange = (source) => {
  try {
    const parseResult = parse(source, { startRule: 'media-range', translator: null });
    return parseResult.result.success;
  } catch {
    return false;
  }
};

export default testMediaRange;
