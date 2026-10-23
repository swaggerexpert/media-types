import parse from '../parse/index.js';

const testAccept = (source) => {
  try {
    const parseResult = parse(source, { type: 'accept', translator: null });
    return parseResult.result.success;
  } catch {
    return false;
  }
};

export default testAccept;
