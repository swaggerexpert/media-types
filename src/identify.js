import parseRule from './parse/rule.js';
import ASTTranslator from './parse/translators/ASTTranslator.js';

/**
 * Identifies the narrowest kind of input the source is valid as.
 * Every media type is also a valid media range and every media range is a valid Accept field value,
 * so the kind is determined by semantics:
 *
 * - single media type with "q" parameter is an Accept field value, as "q" is always a weight
 *   and media type parameters named "q" are disallowed (https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1)
 * - single media type with "*" subtype is a media range (https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1)
 * - any other single media type is a media type
 * - list of media ranges is an Accept field value
 * - list without any elements is not identified
 */
const identify = (source) => {
  if (typeof source !== 'string') return undefined;

  const mediaType = parseRule(source, 'media-type', { translator: new ASTTranslator() });

  if (mediaType.result.success) {
    const { subtype, parameters } = mediaType.tree;

    if (Object.prototype.hasOwnProperty.call(parameters, 'q')) return 'accept';
    if (subtype === '*') return 'media-range';
    return 'media-type';
  }

  const accept = parseRule(source, 'accept', { translator: new ASTTranslator() });

  return accept.result.success && accept.tree.length > 0 ? 'accept' : undefined;
};

export default identify;
