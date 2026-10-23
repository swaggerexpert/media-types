import { toMediaRange, toMediaType, isMatch, normalizeParameterMatching } from './utils.js';

/**
 * Invalid media range or media type never matches.
 */
const matches = (mediaRange, mediaType, options) => {
  const parameterMatching = normalizeParameterMatching(options);
  const mediaRangeAST = toMediaRange(mediaRange);
  const mediaTypeAST = toMediaType(mediaType);

  if (mediaRangeAST === undefined || mediaTypeAST === undefined) return false;

  return isMatch(mediaRangeAST, mediaTypeAST, parameterMatching);
};

export default matches;
