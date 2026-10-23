import { Parser, Trace as BaseTrace, identifiers } from 'apg-lite';

import Expectations from './Expectations.js';

const terminalOperators = [identifiers.TLS, identifiers.TBS, identifiers.TRG];

/**
 * Character never matched by the grammar. Appending it to the source makes the parser attempt
 * terminals at the end of the source, which it otherwise skips (e.g. repetitions stop at the end of input).
 */
const SENTINEL = '\u0000';

const failedTerminals = new WeakMap();

const parseContexts = new WeakMap();

const describeCharacter = (code) => {
  if (code >= 0x21 && code <= 0x7e) return String.fromCharCode(code);
  return `\\x${code.toString(16).toUpperCase().padStart(2, '0')}`;
};

const describeTerminal = (operator) => {
  if (operator.type === identifiers.TRG) {
    return `${describeCharacter(operator.min)}-${describeCharacter(operator.max)}`;
  }

  return operator.string.map(describeCharacter).join('');
};

class Trace extends BaseTrace {
  /**
   * @param {object} [context] grammar, start rule and source of the traced parsing,
   *   needed to infer expectations at the end of the source
   */
  constructor(context = undefined) {
    super();

    const failures = [];
    const { up } = this;

    failedTerminals.set(this, failures);
    if (context !== undefined) parseContexts.set(this, context);

    // record terminals (literal strings, binary strings, ranges) that failed to match and their offsets
    this.up = (operator, state, offset, phraseLength) => {
      if (state === identifiers.NOMATCH && terminalOperators.includes(operator.type)) {
        failures.push({ operator, offset });
      }
      up(operator, state, offset, phraseLength);
    };
  }

  /**
   * Infers what the parser expected at the furthest offset it reached:
   * terminals that failed to match at that offset.
   */
  inferExpectations() {
    const context = parseContexts.get(this);
    let failures = failedTerminals.get(this);

    if (context !== undefined) {
      const { grammar, startRule, source } = context;
      const trace = new Trace();
      const parser = new Parser();

      parser.trace = trace;
      parser.parse(grammar, startRule, `${source}${SENTINEL}`);
      failures = failedTerminals.get(trace);
    }

    const furthestOffset = failures.reduce((max, { offset }) => Math.max(max, offset), -1);
    const expectations = new Set(
      failures
        .filter(({ offset }) => offset === furthestOffset)
        .map(({ operator }) => describeTerminal(operator)),
    );

    return Expectations.from(expectations);
  }
}

export default Trace;
