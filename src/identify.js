import { parseType } from './parse/rule.js';
import CSTTranslator from './parse/translators/CSTTranslator.js';
import { childOfType, childrenOfType } from './utils.js';

/**
 * Classifies successfully parsed media type by its concrete syntax tree root:
 *
 * - single media type with "q" parameter is an Accept field value, as "q" is always a weight
 *   and media type parameters named "q" are disallowed (https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1)
 * - single media type with "*" subtype is a media range (https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1)
 * - any other single media type is a media type
 */
export const classifyMediaType = (root) => {
  const subtype = childOfType(root, 'subtype');
  const parameters = childOfType(root, 'parameters');
  const hasQParameter = childrenOfType(parameters, 'parameter').some(
    (parameter) => childOfType(parameter, 'parameter-name').text.toLowerCase() === 'q',
  );

  if (hasQParameter) return 'accept';
  if (subtype.text === '*') return 'media-range';
  return 'media-type';
};

/**
 * Accept field value without any element consists of optional whitespace and commas only.
 * Must be called for sources successfully parsed as Accept field value.
 */
export const hasElements = (source) => !/^[ \t,]*$/.test(source);

/**
 * Identifies the narrowest kind of input the source is valid as.
 * Every media type is also a valid media range and every media range is a valid Accept field value,
 * so the kind is determined by semantics (see classifyMediaType).
 * List of media ranges is an Accept field value; list without any elements is not identified (null).
 */
const identify = (source) => {
  if (typeof source !== 'string') return null;

  const mediaType = parseType(source, 'media-type', { translator: new CSTTranslator() });

  if (mediaType.result.success) return classifyMediaType(mediaType.tree.root);

  const accept = parseType(source, 'accept');

  return accept.result.success && hasElements(source) ? 'accept' : null;
};

export default identify;
