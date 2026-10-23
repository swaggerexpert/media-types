import CSTTranslator from './CSTTranslator.js';
import testQValue from '../../test/qvalue.js';

const childOfType = (node, type) => node.children.find((child) => child.type === type);

const childrenOfType = (node, type) => node.children.filter((child) => child.type === type);

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
  if (Object.prototype.hasOwnProperty.call(parameters, name)) return;

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
 */
const transformAcceptElement = (mediaRangeNode, weightNode) => {
  const parameterList = transformParameters(childOfType(mediaRangeNode, 'parameters'));
  const qParameter = parameterList.find(({ name }) => name === 'q');
  const qvalue = weightNode ? childOfType(weightNode, 'qvalue').text : qParameter?.value;
  const mediaRange = transformMediaType(
    mediaRangeNode,
    parameterList.filter(({ name }) => name !== 'q'),
  );

  let weight = 1;
  if (qvalue !== undefined) {
    weight = testQValue(qvalue) ? parseFloat(qvalue) : NaN;
  }

  return { ...mediaRange, weight };
};

const transformAccept = (node) => {
  const elements = [];

  node.children.forEach((child) => {
    if (child.type === 'media-range') {
      elements.push({ mediaRangeNode: child, weightNode: undefined });
    } else if (child.type === 'weight') {
      elements[elements.length - 1].weightNode = child;
    }
  });

  return elements.map(({ mediaRangeNode, weightNode }) =>
    transformAcceptElement(mediaRangeNode, weightNode),
  );
};

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
