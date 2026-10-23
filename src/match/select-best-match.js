import {
  toList,
  toMediaRange,
  toMediaType,
  findMostSpecific,
  normalizeParameterMatching,
} from './utils.js';

/**
 * Invalid media ranges are skipped, invalid media type matches nothing.
 * Returns null when nothing matches.
 */
const selectBestMatch = (mediaRanges, mediaType, options) => {
  const parameterMatching = normalizeParameterMatching(options);
  const values = toList(mediaRanges, 'media ranges');
  const mediaTypeAST = toMediaType(mediaType);

  if (mediaTypeAST === undefined) return null;

  const { index } = findMostSpecific(values.map(toMediaRange), mediaTypeAST, parameterMatching);

  return index === -1 ? null : values[index];
};

export default selectBestMatch;
