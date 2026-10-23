import { toAcceptMediaRanges, toMediaType, findMostSpecific, compareSpecificity } from './utils.js';

/**
 * Orders available media types by preference expressed in the Accept field value.
 * Media types that are not acceptable (quality value of 0) or invalid are omitted.
 * A request without any Accept field implies that any media type is acceptable.
 * https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1
 */
const negotiate = (accept, mediaTypes) => {
  const mediaRanges = toAcceptMediaRanges(accept);
  const candidates = Array.from(mediaTypes)
    .map((value, index) => ({ value, index, mediaType: toMediaType(value) }))
    .filter(({ mediaType }) => mediaType !== undefined);

  if (mediaRanges === undefined) return candidates.map(({ value }) => value);

  return candidates
    .map((candidate) => {
      const { mediaRange, index: mediaRangeIndex } = findMostSpecific(
        mediaRanges,
        candidate.mediaType,
      );
      return { ...candidate, mediaRange, mediaRangeIndex };
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
