import { Parser, Stats } from 'apg-lite';

import Grammar from '../grammar.js';
import MediaTypeParseError from '../errors/MediaTypeParseError.js';
import ASTTranslator from './translators/ASTTranslator.js';
import Trace from './trace/Trace.js';

const grammar = new Grammar();

const parse = (
  source,
  { startRule = 'media-type', translator = new ASTTranslator(), stats = false, trace = false } = {},
) => {
  if (typeof source !== 'string') {
    throw new TypeError('Source must be a string');
  }

  try {
    const parser = new Parser();

    if (translator) parser.ast = translator;
    if (stats) parser.stats = new Stats();
    if (trace) parser.trace = new Trace();

    const result = parser.parse(grammar, startRule, source);

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
      startRule,
    });
  }
};

export default parse;
