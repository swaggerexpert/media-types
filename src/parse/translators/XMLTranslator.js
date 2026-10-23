import CSTTranslator from './CSTTranslator.js';

const escapeXML = (text) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const indent = (depth) => ' '.repeat(depth);

const countNodes = (node) => node.children.reduce((count, child) => count + countNodes(child), 1);

const nodeToXML = (node, depth) => {
  const children = node.children.map((child) => nodeToXML(child, depth + 1)).join('');

  return (
    `${indent(depth)}<node name="${escapeXML(node.type)}" index="${node.start}" length="${node.length}">\n` +
    `${indent(depth + 2)}${escapeXML(node.text)}\n` +
    children +
    `${indent(depth)}</node><!-- name="${escapeXML(node.type)}" -->\n`
  );
};

/**
 * XML representation of the concrete syntax tree, in the format of apg-lite,
 * with the source and node texts escaped, so that the result is always well-formed XML.
 */
class XMLTranslator extends CSTTranslator {
  getTree() {
    const { root } = super.getTree();

    return (
      '<?xml version="1.0" encoding="utf-8"?>\n' +
      `<root nodes="${countNodes(root)}" characters="${root.text.length}">\n` +
      '<!-- input string -->\n' +
      `${indent(2)}${escapeXML(root.text)}\n` +
      nodeToXML(root, 1) +
      '</root>\n'
    );
  }
}

export default XMLTranslator;
