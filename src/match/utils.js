import parse from '../parse/index.js';
import MediaTypeParseError from '../errors/MediaTypeParseError.js';

const labels = {
  'media-type': 'media type',
  'media-range': 'media range',
  Accept: 'Accept field value',
};

/**
 * Turns a string into its AST, while already parsed values pass through.
 */
export const toAST = (value, startRule) => {
  if (typeof value !== 'string') return value;

  const parseResult = parse(value, { startRule });

  if (!parseResult.result.success) {
    throw new MediaTypeParseError(`Invalid ${labels[startRule]}: "${value}"`, {
      source: value,
      startRule,
    });
  }

  return parseResult.tree;
};

/**
 * Charset names are case-insensitive, other parameter values depend on parameter semantics.
 * https://www.rfc-editor.org/rfc/rfc9110#section-8.3.1
 * https://www.rfc-editor.org/rfc/rfc9110#section-8.3.2
 */
const parameterValuesEqual = (name, value1, value2) => {
  if (name === 'charset') return value1.toLowerCase() === value2.toLowerCase();
  return value1 === value2;
};

const hasOwn = (object, property) => Object.prototype.hasOwnProperty.call(object, property);

/**
 * https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1
 */
export const isMatch = (mediaRange, mediaType) => {
  const isFullWildcard = mediaRange.type === '*' && mediaRange.subtype === '*';

  if (!isFullWildcard) {
    if (mediaRange.type !== mediaType.type) return false;
    if (mediaRange.subtype !== '*' && mediaRange.subtype !== mediaType.subtype) return false;
  }

  return Object.keys(mediaRange.parameters).every(
    (name) =>
      hasOwn(mediaType.parameters, name) &&
      parameterValuesEqual(name, mediaRange.parameters[name], mediaType.parameters[name]),
  );
};

/**
 * Media ranges can be overridden by more specific media ranges or specific media types.
 * https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1
 */
export const compareSpecificity = (mediaRange1, mediaRange2) => {
  const level = ({ type, subtype }) => {
    if (type === '*' && subtype === '*') return 0;
    if (subtype === '*') return 1;
    return 2;
  };

  return (
    level(mediaRange1) - level(mediaRange2) ||
    Object.keys(mediaRange1.parameters).length - Object.keys(mediaRange2.parameters).length
  );
};

/**
 * Finds the most specific media range matching the media type.
 * In case of equal specificity, the first media range wins.
 */
export const findMostSpecific = (mediaRanges, mediaType) => {
  let best;
  let bestIndex = -1;

  mediaRanges.forEach((mediaRange, index) => {
    if (!isMatch(mediaRange, mediaType)) return;
    if (best === undefined || compareSpecificity(mediaRange, best) > 0) {
      best = mediaRange;
      bestIndex = index;
    }
  });

  return { mediaRange: best, index: bestIndex };
};
