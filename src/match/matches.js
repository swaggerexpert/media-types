import { toMediaRange, toMediaType, isMatch } from './utils.js';

/**
 * Invalid media range or media type never matches.
 */
const matches = (mediaRange, mediaType) => {
  const mediaRangeAST = toMediaRange(mediaRange);
  const mediaTypeAST = toMediaType(mediaType);

  if (mediaRangeAST === undefined || mediaTypeAST === undefined) return false;

  return isMatch(mediaRangeAST, mediaTypeAST);
};

export default matches;
