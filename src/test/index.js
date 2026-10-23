import parseRule, { normalizeType } from '../parse/rule.js';
import identify from '../identify.js';

/**
 * Tests whether the source is valid. Accepts the same type option as parse,
 * and is equivalent to the success of parsing.
 * Without type, the source is valid when it can be identified.
 */
const test = (source, options) => {
  const type = normalizeType(options?.type);

  if (typeof source !== 'string') return false;

  if (type === undefined) return identify(source) !== null;

  return parseRule(source, type, { translator: null }).result.success;
};

export default test;
