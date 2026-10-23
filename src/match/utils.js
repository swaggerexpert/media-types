import parse from '../parse/index.js';
import { hasOwn, isPlainObject, normalizeOptions } from '../utils.js';

const isMediaTypeAST = (value) =>
  isPlainObject(value) &&
  typeof value.type === 'string' &&
  typeof value.subtype === 'string' &&
  isPlainObject(value.parameters) &&
  Object.values(value.parameters).every((parameterValue) => typeof parameterValue === 'string');

const isAcceptAST = (value) =>
  Array.isArray(value) &&
  value.every((element) => isMediaTypeAST(element) && typeof element.weight === 'number');

const describe = (value) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

/**
 * Turns a string into its AST, while already parsed values pass through.
 * Returns undefined for strings that are not valid according to the type.
 * Throws TypeError for values that are neither strings nor ASTs of the type.
 */
const toAST = (value, type) => {
  if (typeof value === 'string') {
    const parseResult = parse(value, { type });
    return parseResult.result.success ? parseResult.tree : undefined;
  }

  const isAST = type === 'accept' ? isAcceptAST(value) : isMediaTypeAST(value);
  if (isAST) return value;

  throw new TypeError(`Expected string or parsed ${type}, got ${describe(value)}`);
};

export const toMediaType = (value) => toAST(value, 'media-type');

export const toMediaRange = (value) => toAST(value, 'media-range');

/**
 * Turns an iterable of values into an array.
 * Strings are rejected, as they are iterable and would be split into characters.
 */
export const toList = (values, name) => {
  if (
    typeof values === 'string' ||
    values === null ||
    values === undefined ||
    typeof values[Symbol.iterator] !== 'function'
  ) {
    throw new TypeError(`Expected ${name} to be an iterable of values, got ${describe(values)}`);
  }

  return Array.from(values);
};

/**
 * Returns index of the double quote closing a quoted-string, or -1 when it is not terminated.
 * https://www.rfc-editor.org/rfc/rfc9110#section-5.6.4
 */
const findQuotedStringEnd = (value, from) => {
  for (let index = from; index < value.length; index += 1) {
    if (value[index] === '\\') {
      index += 1;
    } else if (value[index] === '"') {
      return index;
    }
  }

  return -1;
};

/**
 * Splits a list field value on commas outside of quoted-strings.
 * A quoted-string can only start a parameter value, i.e. right after "=".
 * Unterminated quoted-string is not a quoted-string, so that commas after it still split elements.
 * Runs in linear time.
 * https://www.rfc-editor.org/rfc/rfc9110#section-5.6.1
 */
const splitList = (value) => {
  const elements = [];
  let start = 0;
  let hasQuotedStringEnd = true;
  let index = 0;

  while (index < value.length) {
    const char = value[index];

    if (char === '"' && value[index - 1] === '=' && hasQuotedStringEnd) {
      const end = findQuotedStringEnd(value, index + 1);

      if (end !== -1) {
        index = end + 1;
        continue;
      }

      // no closing double quote follows, so no later quoted-string can be terminated either
      hasQuotedStringEnd = false;
    } else if (char === ',') {
      elements.push(value.slice(start, index));
      start = index + 1;
    }

    index += 1;
  }
  elements.push(value.slice(start));

  return elements;
};

/**
 * Removes optional whitespace around the value, in linear time.
 * https://www.rfc-editor.org/rfc/rfc9110#section-5.6.3
 */
const trimOWS = (value) => {
  const isOWS = (char) => char === ' ' || char === '\t';
  let start = 0;
  let end = value.length;

  while (start < end && isOWS(value[start])) start += 1;
  while (end > start && isOWS(value[end - 1])) end -= 1;

  return value.slice(start, end);
};

/**
 * Recovers valid elements from an invalid Accept field value; invalid elements are dropped.
 * https://www.rfc-editor.org/rfc/rfc9110#section-2.4
 */
const recoverAccept = (accept) =>
  splitList(accept).flatMap((element) => toAST(trimOWS(element), 'accept') ?? []);

/**
 * Returns usable media ranges of an Accept field value, or undefined when there is no preference.
 * Both undefined and null Accept field value mean that the Accept field is missing.
 * Elements with invalid qvalue are not usable. Accept field value without any usable element
 * is treated the same as a missing Accept field.
 * https://www.rfc-editor.org/rfc/rfc9110#section-12.4.1
 */
export const toAcceptMediaRanges = (accept) => {
  if (accept === undefined || accept === null) return undefined;

  const mediaRanges = (toAST(accept, 'accept') ?? recoverAccept(accept)).filter(
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

const parameterMatchings = ['required', 'compatible'];

/**
 * Validates the parameterMatching option of matching functions.
 * Both undefined and null mean the default "required" parameter matching.
 */
export const normalizeParameterMatching = (options) => {
  const { parameterMatching } = normalizeOptions(options);

  if (parameterMatching === undefined || parameterMatching === null) return 'required';

  if (!parameterMatchings.includes(parameterMatching)) {
    throw new TypeError(`Parameter matching must be one of ${parameterMatchings.join(', ')}`);
  }

  return parameterMatching;
};

const level = ({ type, subtype }) => {
  if (type === '*' && subtype === '*') return 0;
  if (subtype === '*') return 1;
  return 2;
};

/**
 * Matches media range against media type. Returns undefined when they do not match,
 * otherwise specificity of the match.
 *
 * Parameter matching:
 * - "required": every parameter of the media range must be present in the media type
 *   with an equal value (https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1)
 * - "compatible": parameters present on both sides must have an equal value,
 *   parameters present on one side only are ignored
 *
 * Parameter "q" of the media range is ignored, as it is always a weight
 * and media type parameters named "q" are disallowed (https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1).
 */
const match = (mediaRange, mediaType, parameterMatching) => {
  const isFullWildcard = mediaRange.type === '*' && mediaRange.subtype === '*';

  if (!isFullWildcard) {
    if (mediaRange.type !== mediaType.type) return undefined;
    if (mediaRange.subtype !== '*' && mediaRange.subtype !== mediaType.subtype) return undefined;
  }

  let agreeing = 0;
  let rangeOnly = 0;

  for (const name of Object.keys(mediaRange.parameters)) {
    if (name === 'q') continue;

    if (!hasOwn(mediaType.parameters, name)) {
      if (parameterMatching === 'required') return undefined;
      rangeOnly += 1;
    } else if (
      !parameterValuesEqual(name, mediaRange.parameters[name], mediaType.parameters[name])
    ) {
      return undefined;
    } else {
      agreeing += 1;
    }
  }

  return { level: level(mediaRange), agreeing, rangeOnly };
};

export const isMatch = (mediaRange, mediaType, parameterMatching = 'required') =>
  match(mediaRange, mediaType, parameterMatching) !== undefined;

/**
 * Media ranges can be overridden by more specific media ranges or specific media types.
 * https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1
 *
 * Precedence of matches: exact type and subtype, then subtype wildcard, then full wildcard;
 * on equal level more agreeing parameters, then fewer parameters present only on the media range.
 */
export const compareMatches = (match1, match2) =>
  match1.level - match2.level ||
  match1.agreeing - match2.agreeing ||
  match2.rangeOnly - match1.rangeOnly;

/**
 * Finds the most specific media range matching the media type.
 * Invalid (undefined) media ranges are skipped.
 * In case of equal precedence, the first media range wins.
 */
export const findMostSpecific = (mediaRanges, mediaType, parameterMatching = 'required') => {
  let best;
  let bestMatch;
  let bestIndex = -1;

  mediaRanges.forEach((mediaRange, index) => {
    if (mediaRange === undefined) return;

    const currentMatch = match(mediaRange, mediaType, parameterMatching);

    if (currentMatch === undefined) return;
    if (bestMatch === undefined || compareMatches(currentMatch, bestMatch) > 0) {
      best = mediaRange;
      bestMatch = currentMatch;
      bestIndex = index;
    }
  });

  return { mediaRange: best, index: bestIndex, match: bestMatch };
};
