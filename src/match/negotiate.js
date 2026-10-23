import {
  toList,
  toAcceptMediaRanges,
  toMediaType,
  findMostSpecific,
  compareMatches,
} from './utils.js';

/**
 * Orders available media types by preference expressed in the Accept field value.
 * Media types that are not acceptable (quality value of 0) or invalid are omitted.
 * A request without any Accept field (undefined or null) implies that any media type is acceptable.
 * https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1
 */
const negotiate = (accept, mediaTypes) => {
  const mediaRanges = toAcceptMediaRanges(accept);
  const candidates = toList(mediaTypes, 'media types')
    .map((value, index) => ({ value, index, mediaType: toMediaType(value) }))
    .filter(({ mediaType }) => mediaType !== undefined);

  if (mediaRanges === undefined) return candidates.map(({ value }) => value);

  return candidates
    .map((candidate) => {
      const {
        mediaRange,
        index: mediaRangeIndex,
        match,
      } = findMostSpecific(mediaRanges, candidate.mediaType);
      return { ...candidate, mediaRange, mediaRangeIndex, match };
    })
    .filter(({ mediaRange }) => mediaRange !== undefined && mediaRange.weight > 0)
    .sort(
      (a, b) =>
        b.mediaRange.weight - a.mediaRange.weight ||
        compareMatches(b.match, a.match) ||
        a.mediaRangeIndex - b.mediaRangeIndex ||
        a.index - b.index,
    )
    .map(({ value }) => value);
};

export default negotiate;
