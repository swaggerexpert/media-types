import ASTTranslator from './translators/ASTTranslator.js';
import CSTTranslator from './translators/CSTTranslator.js';
import { normalizeType, parseType } from './rule.js';
import identify, { classifyMediaType, hasElements } from '../identify.js';
import { normalizeOptions } from '../utils.js';

/**
 * Without type, the type of the source is determined by identify.
 * Translators based on CSTTranslator record the concrete syntax tree needed for identification,
 * so that parsing done for identification is reused instead of repeated.
 */
const parseIdentified = (source, translator, options) => {
  const mediaType = parseType(source, 'media-type', options);

  if (mediaType.result.success) {
    const { root } = CSTTranslator.prototype.getTree.call(translator);
    const type = classifyMediaType(root);

    return type === 'media-type' ? mediaType : parseType(source, type, options);
  }

  const accept = parseType(source, 'accept', options);

  if (accept.result.success && hasElements(source)) return accept;

  // source that cannot be identified is parsed as media type to produce meaningful result and trace
  return mediaType;
};

const parse = (source, options) => {
  const {
    type,
    translator = new ASTTranslator(),
    stats = false,
    trace = false,
  } = normalizeOptions(options);
  const explicitType = normalizeType(type);

  if (typeof source !== 'string') {
    throw new TypeError('Source must be a string');
  }

  const parseOptions = { translator, stats, trace };

  if (explicitType !== undefined) return parseType(source, explicitType, parseOptions);

  if (translator instanceof CSTTranslator) return parseIdentified(source, translator, parseOptions);

  // source that cannot be identified is parsed as media type to produce meaningful result and trace
  return parseType(source, identify(source) ?? 'media-type', parseOptions);
};

export default parse;
