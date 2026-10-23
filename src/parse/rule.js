import { Parser, Stats } from 'apg-lite';

import Grammar from '../grammar.js';
import MediaTypeParseError from '../errors/MediaTypeParseError.js';
import Trace from './trace/Trace.js';

const grammar = new Grammar();

/**
 * Maps public input types to grammar start rules.
 */
export const startRules = {
  'media-type': 'media-type',
  'media-range': 'media-range',
  accept: 'Accept',
};

/**
 * Validates the type option. Both undefined and null mean that the type is not specified.
 * Returns the type or undefined.
 */
export const normalizeType = (type) => {
  if (type === undefined || type === null) return undefined;

  if (typeof type !== 'string' || !Object.prototype.hasOwnProperty.call(startRules, type)) {
    throw new TypeError(`Type must be one of ${Object.keys(startRules).join(', ')}`);
  }

  return type;
};

const parseRule = (source, type, { translator, stats = false, trace = false }) => {
  try {
    const parser = new Parser();

    if (translator) parser.ast = translator;
    if (stats) parser.stats = new Stats();
    if (trace) parser.trace = new Trace();

    const result = parser.parse(grammar, startRules[type], source);

    return {
      result,
      tree: result.success && translator ? parser.ast.getTree() : undefined,
      stats: parser.stats,
      trace: parser.trace,
    };
  } catch (error) {
    throw new MediaTypeParseError('Unexpected error during media type parsing', {
      cause: error,
      source,
      type,
    });
  }
};

export default parseRule;
