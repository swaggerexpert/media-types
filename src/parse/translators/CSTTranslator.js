import { Ast as AST } from 'apg-lite';

import cstCallback from '../callbacks/cst.js';

class CSTTranslator extends AST {
  constructor() {
    super();

    this.callbacks['Accept'] = cstCallback('Accept');
    this.callbacks['media-range'] = cstCallback('media-range');
    this.callbacks['media-type'] = cstCallback('media-type');
    this.callbacks['type'] = cstCallback('type');
    this.callbacks['subtype'] = cstCallback('subtype');
    this.callbacks['parameters'] = cstCallback('parameters');
    this.callbacks['parameter'] = cstCallback('parameter');
    this.callbacks['parameter-name'] = cstCallback('parameter-name');
    this.callbacks['parameter-value'] = cstCallback('parameter-value');
  }

  getTree() {
    const data = { stack: [], root: null };
    this.translate(data);
    delete data.stack;
    return data;
  }
}

export default CSTTranslator;
