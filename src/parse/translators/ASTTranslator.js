import CSTTranslator from './CSTTranslator.js';
import testQValue from '../../test/qvalue.js';
import { childOfType, childrenOfType, hasOwn } from '../../utils.js';

/**
 * Removes surrounding double quotes and resolves quoted-pairs.
 * https://www.rfc-editor.org/rfc/rfc9110#section-5.6.4
 */
const unquote = (parameterValue) => {
  if (!parameterValue.startsWith('"')) return parameterValue;

  return parameterValue.slice(1, -1).replace(/\\([\s\S])/g, '$1');
};

/**
 * Structured syntax suffix is the part of the subtype after the last "+".
 * https://www.rfc-editor.org/rfc/rfc6838#section-4.2.8
 */
const suffixOf = (subtype) => {
  const index = subtype.lastIndexOf('+');

  return index > 0 && index < subtype.length - 1 ? subtype.slice(index + 1) : undefined;
};

/**
 * Type, subtype and parameter names are case-insensitive and are normalized to lower case.
 * Parameter values are kept as they are, as their case-sensitivity depends on parameter semantics.
 * https://www.rfc-editor.org/rfc/rfc9110#section-8.3.1
 */
const transformParameters = (node) => {
  const parameterNodes = node ? childrenOfType(node, 'parameter') : [];

  return parameterNodes.map((parameterNode) => ({
    name: childOfType(parameterNode, 'parameter-name').text.toLowerCase(),
    value: unquote(childOfType(parameterNode, 'parameter-value').text),
  }));
};

const assignParameter = (parameters, name, value) => {
  // a parameter must not occur more than once; first occurrence wins
  // https://www.rfc-editor.org/rfc/rfc6838#section-4.3
  if (hasOwn(parameters, name)) return;

  Object.defineProperty(parameters, name, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
};

const transformMediaType = (node, parameterList) => {
  const type = childOfType(node, 'type').text.toLowerCase();
  const subtype = childOfType(node, 'subtype').text.toLowerCase();
  const suffix = suffixOf(subtype);
  const parameters = {};

  parameterList.forEach(({ name, value }) => assignParameter(parameters, name, value));

  return {
    type,
    subtype,
    ...(suffix !== undefined && { suffix }),
    parameters,
  };
};

/**
 * Recipients process any parameter named "q" as weight, regardless of parameter ordering.
 * https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1
 *
 * The weight rule of the grammar never matches, as the preceding parameters rule always consumes
 * the "q" parameter, so the weight is always taken from the parameters.
 */
const transformAcceptElement = (mediaRangeNode) => {
  const parameterList = transformParameters(childOfType(mediaRangeNode, 'parameters'));
  const qParameter = parameterList.find(({ name }) => name === 'q');
  const mediaRange = transformMediaType(
    mediaRangeNode,
    parameterList.filter(({ name }) => name !== 'q'),
  );

  let weight = 1;
  if (qParameter !== undefined) {
    weight = testQValue(qParameter.value) ? parseFloat(qParameter.value) : NaN;
  }

  return { ...mediaRange, weight };
};

const transformAccept = (node) => childrenOfType(node, 'media-range').map(transformAcceptElement);

class ASTTranslator extends CSTTranslator {
  getTree() {
    const { root } = super.getTree();

    if (root.type === 'Accept') {
      return transformAccept(root);
    }

    return transformMediaType(root, transformParameters(childOfType(root, 'parameters')));
  }
}

export default ASTTranslator;
