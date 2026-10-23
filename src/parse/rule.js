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
