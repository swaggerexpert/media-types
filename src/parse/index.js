import ASTTranslator from './translators/ASTTranslator.js';
import parseRule, { startRules } from './rule.js';
import identify from '../identify.js';

const parse = (
  source,
  { type, translator = new ASTTranslator(), stats = false, trace = false } = {},
) => {
  if (typeof source !== 'string') {
    throw new TypeError('Source must be a string');
  }

  if (
    type !== undefined &&
    type !== null &&
    !Object.prototype.hasOwnProperty.call(startRules, type)
  ) {
    throw new TypeError(`Type must be one of ${Object.keys(startRules).join(', ')}`);
  }

  // source that cannot be identified is parsed as media type to produce meaningful result and trace
  const resolvedType = type ?? identify(source) ?? 'media-type';

  return parseRule(source, resolvedType, { translator, stats, trace });
};

export default parse;
