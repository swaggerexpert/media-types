import parse from '../parse/index.js';

/**
 * Turns a string into its AST, while already parsed values pass through.
 * Returns undefined for strings that are not valid according to the start rule.
 */
const toAST = (value, startRule) => {
  if (typeof value === 'string') {
    const parseResult = parse(value, { startRule });
    return parseResult.result.success ? parseResult.tree : undefined;
  }

  if (typeof value === 'object' && value !== null) return value;

  throw new TypeError(
    `Expected string or parsed ${startRule}, got ${value === null ? 'null' : typeof value}`,
  );
};

export const toMediaType = (value) => toAST(value, 'media-type');

export const toMediaRange = (value) => toAST(value, 'media-range');

/**
 * Splits a list field value on commas outside of quoted-strings.
 * https://www.rfc-editor.org/rfc/rfc9110#section-5.6.1
 */
const splitList = (value) => {
  const elements = [];
  let start = 0;
  let quoted = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (quoted && char === '\\') {
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      elements.push(value.slice(start, index));
      start = index + 1;
    }
  }
  elements.push(value.slice(start));

  return elements;
};

/**
 * Recovers valid elements from an invalid Accept field value; invalid elements are dropped.
 * https://www.rfc-editor.org/rfc/rfc9110#section-2.4
 */
const recoverAccept = (accept) =>
  splitList(accept).flatMap(
    (element) => toAST(element.replace(/^[ \t]+|[ \t]+$/g, ''), 'Accept') ?? [],
  );

/**
 * Returns usable media ranges of an Accept field value, or undefined when there is no preference.
 * Elements with invalid qvalue are not usable. Accept field value without any usable element
 * is treated the same as a missing Accept field.
 * https://www.rfc-editor.org/rfc/rfc9110#section-12.4.1
 */
export const toAcceptMediaRanges = (accept) => {
  if (accept === undefined) return undefined;

  const mediaRanges = (toAST(accept, 'Accept') ?? recoverAccept(accept)).filter(
    ({ weight }) => !Number.isNaN(weight),
  );

  return mediaRanges.length > 0 ? mediaRanges : undefined;
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
 * Invalid (undefined) media ranges are skipped.
 * In case of equal specificity, the first media range wins.
 */
export const findMostSpecific = (mediaRanges, mediaType) => {
  let best;
  let bestIndex = -1;

  mediaRanges.forEach((mediaRange, index) => {
    if (mediaRange === undefined || !isMatch(mediaRange, mediaType)) return;
    if (best === undefined || compareSpecificity(mediaRange, best) > 0) {
      best = mediaRange;
      bestIndex = index;
    }
  });

  return { mediaRange: best, index: bestIndex };
};
