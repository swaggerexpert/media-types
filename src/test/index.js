import parse from '../parse/index.js';
import { startRules } from '../parse/rule.js';

/**
 * Tests whether the source is valid. Accepts the same type option as parse,
 * and is equivalent to the success of parsing.
 */
const test = (source, { type } = {}) => {
  if (type !== undefined && !Object.prototype.hasOwnProperty.call(startRules, type)) {
    throw new TypeError(`Type must be one of ${Object.keys(startRules).join(', ')}`);
  }

  if (typeof source !== 'string') return false;

  try {
    return parse(source, { type, translator: null }).result.success;
  } catch {
    return false;
  }
};

export default test;
