export const hasOwn = (object, property) => Object.prototype.hasOwnProperty.call(object, property);

export const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const childOfType = (node, type) => node.children.find((child) => child.type === type);

export const childrenOfType = (node, type) => node.children.filter((child) => child.type === type);

/**
 * Validates options argument. Both undefined and null mean no options.
 */
export const normalizeOptions = (options) => {
  if (options === undefined || options === null) return {};

  if (!isPlainObject(options)) {
    throw new TypeError(
      `Options must be an object, got ${Array.isArray(options) ? 'array' : typeof options}`,
    );
  }

  return options;
};
