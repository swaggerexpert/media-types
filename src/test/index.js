import { normalizeType, parseType } from '../parse/rule.js';
import { hasElements } from '../identify.js';
import { normalizeOptions } from '../utils.js';

/**
 * Tests whether the source is valid. Accepts the same type option as parse,
 * and is equivalent to the success of parsing.
 */
const test = (source, options) => {
  const type = normalizeType(normalizeOptions(options).type);

  if (typeof source !== 'string') return false;

  if (type !== undefined) return parseType(source, type).result.success;

  // without type, the source is valid when it can be identified: as media type (which covers
  // media ranges and single element Accept field values), or as Accept field value with elements
  if (parseType(source, 'media-type').result.success) return true;

  return parseType(source, 'accept').result.success && hasElements(source);
};

export default test;
