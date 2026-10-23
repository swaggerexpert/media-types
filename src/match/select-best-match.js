import { toAST, findMostSpecific } from './utils.js';

const selectBestMatch = (mediaRanges, mediaType) => {
  const values = Array.from(mediaRanges);
  const { index } = findMostSpecific(
    values.map((mediaRange) => toAST(mediaRange, 'media-range')),
    toAST(mediaType, 'media-type'),
  );

  return index === -1 ? undefined : values[index];
};

export default selectBestMatch;
