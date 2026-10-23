import parseRule from './parse/rule.js';
import CSTTranslator from './parse/translators/CSTTranslator.js';

const childrenOfType = (node, type) => node.children.filter((child) => child.type === type);

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
 * - list without any elements is not identified (null)
 */
const identify = (source) => {
  if (typeof source !== 'string') return null;

  const mediaType = parseRule(source, 'media-type', { translator: new CSTTranslator() });

  if (mediaType.result.success) {
    const { root } = mediaType.tree;
    const [subtype] = childrenOfType(root, 'subtype');
    const [parameters] = childrenOfType(root, 'parameters');
    const hasQParameter = childrenOfType(parameters, 'parameter').some(
      (parameter) => childrenOfType(parameter, 'parameter-name')[0].text.toLowerCase() === 'q',
    );

    if (hasQParameter) return 'accept';
    if (subtype.text === '*') return 'media-range';
    return 'media-type';
  }

  const accept = parseRule(source, 'accept', { translator: new CSTTranslator() });

  return accept.result.success && childrenOfType(accept.tree.root, 'media-range').length > 0
    ? 'accept'
    : null;
};

export default identify;
