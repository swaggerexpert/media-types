import { toAST, isMatch } from './utils.js';

const matches = (mediaRange, mediaType) => {
  return isMatch(toAST(mediaRange, 'media-range'), toAST(mediaType, 'media-type'));
};

export default matches;
