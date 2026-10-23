import parse from '../parse/index.js';

const testAccept = (source) => {
  try {
    const parseResult = parse(source, { startRule: 'Accept', translator: null });
    return parseResult.result.success;
  } catch {
    return false;
  }
};

export default testAccept;
