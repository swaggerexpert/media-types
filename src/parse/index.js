import ASTTranslator from './translators/ASTTranslator.js';
import parseRule, { normalizeType } from './rule.js';
import identify from '../identify.js';

const parse = (source, options) => {
  const { type, translator = new ASTTranslator(), stats = false, trace = false } = options ?? {};

  if (typeof source !== 'string') {
    throw new TypeError('Source must be a string');
  }

  // source that cannot be identified is parsed as media type to produce meaningful result and trace
  const resolvedType = normalizeType(type) ?? identify(source) ?? 'media-type';

  return parseRule(source, resolvedType, { translator, stats, trace });
};

export default parse;
