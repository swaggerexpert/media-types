import parse from '../parse/index.js';

const testMediaType = (source) => {
  try {
    const parseResult = parse(source, { startRule: 'media-type', translator: null });
    return parseResult.result.success;
  } catch {
    return false;
  }
};

export default testMediaType;
