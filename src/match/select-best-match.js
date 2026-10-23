import { toMediaRange, toMediaType, findMostSpecific } from './utils.js';

/**
 * Invalid media ranges are skipped, invalid media type matches nothing.
 * Returns null when nothing matches.
 */
const selectBestMatch = (mediaRanges, mediaType) => {
  const values = Array.from(mediaRanges);
  const mediaRangeASTs = values.map(toMediaRange);
  const mediaTypeAST = toMediaType(mediaType);

  if (mediaTypeAST === undefined) return null;

  const { index } = findMostSpecific(mediaRangeASTs, mediaTypeAST);

  return index === -1 ? null : values[index];
};

export default selectBestMatch;
