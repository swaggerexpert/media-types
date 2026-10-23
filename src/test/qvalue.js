import { parseRule } from '../parse/rule.js';

/**
 * https://www.rfc-editor.org/rfc/rfc9110#section-12.4.2
 */
const testQValue = (qvalue) =>
  typeof qvalue === 'string' && parseRule(qvalue, 'qvalue').result.success;

export default testQValue;
