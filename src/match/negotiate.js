import { toAST, findMostSpecific, compareSpecificity } from './utils.js';

/**
 * Orders available media types by preference expressed in the Accept field value.
 * Media types that are not acceptable (quality value of 0) are omitted.
 * A request without any Accept field implies that any media type is acceptable.
 * https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1
 */
const negotiate = (accept, mediaTypes) => {
  const values = Array.from(mediaTypes);

  if (accept === undefined) return values;

  const mediaRanges = toAST(accept, 'Accept');

  return values
    .map((value, index) => {
      const { mediaRange, index: mediaRangeIndex } = findMostSpecific(
        mediaRanges,
        toAST(value, 'media-type'),
      );
      return { value, index, mediaRange, mediaRangeIndex };
    })
    .filter(({ mediaRange }) => mediaRange !== undefined && mediaRange.weight > 0)
    .sort(
      (a, b) =>
        b.mediaRange.weight - a.mediaRange.weight ||
        compareSpecificity(b.mediaRange, a.mediaRange) ||
        a.mediaRangeIndex - b.mediaRangeIndex ||
        a.index - b.index,
    )
    .map(({ value }) => value);
};

export default negotiate;
