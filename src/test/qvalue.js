import { Parser } from 'apg-lite';

import Grammar from '../grammar.js';

const grammar = new Grammar();

const testQValue = (qvalue) => {
  if (typeof qvalue !== 'string') return false;

  try {
    const parser = new Parser();
    return parser.parse(grammar, 'qvalue', qvalue).success;
  } catch {
    return false;
  }
};

export default testQValue;
