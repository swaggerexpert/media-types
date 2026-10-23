import { toAcceptMediaRanges, toMediaType, findMostSpecific } from './utils.js';

/**
 * The quality value associated with a media type is determined by
 * finding the media range with the highest precedence that matches the type.
 * Invalid media type is never acceptable.
 * https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1
 */
const quality = (accept, mediaType) => {
  const mediaRanges = toAcceptMediaRanges(accept);
  const mediaTypeAST = toMediaType(mediaType);

  if (mediaTypeAST === undefined) return 0;
  if (mediaRanges === undefined) return 1;

  const { mediaRange } = findMostSpecific(mediaRanges, mediaTypeAST);

  return mediaRange === undefined ? 0 : mediaRange.weight;
};

export default quality;
