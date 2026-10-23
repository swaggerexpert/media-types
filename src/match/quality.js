import { toAST, findMostSpecific } from './utils.js';

/**
 * The quality value associated with a media type is determined by
 * finding the media range with the highest precedence that matches the type.
 * https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1
 */
const quality = (accept, mediaType) => {
  if (accept === undefined) return 1;

  const { mediaRange } = findMostSpecific(toAST(accept, 'Accept'), toAST(mediaType, 'media-type'));

  return mediaRange === undefined || Number.isNaN(mediaRange.weight) ? 0 : mediaRange.weight;
};

export default quality;
