import { BaseNode } from 'estree';

import { debugLog, Lazy } from './utils';

const internal = Symbol('internal');

export class NodePath<T extends BaseNode = BaseNode> {
  node: T;
  /** This node's key in its parent */
  key: string | number;
  /** If this node is part of an array, `listKey` is the key of the array in its parent */
  listKey: string | undefined;

  [internal]: {
    getParentPath: Lazy<NodePath | undefined>;
  };

  static get internalSymbol() {
    return internal;
  }

  constructor(data: {
    node: T;
    key: string | number;
    listKey: string | undefined;
    getParentPath: Lazy<NodePath | undefined>;
  }) {
    this.node = data.node;
    this.key = data.key;
    this.listKey = data.listKey;

    this[internal] = {
      getParentPath: data.getParentPath
    }
  }

  get parentPath() {
    return this[internal].getParentPath();
  }

  /* Things related to removal */

  /** If the node has been removed from its parent */
  isRemoved() {
    if (!this.parentPath) return false;
    if (this.listKey) {
      return ((this.parentPath.node as any)[this.listKey] as BaseNode[]).indexOf(this.node) > -1;
    } else if (this.key) {
      return (this.parentPath.node as any)[this.key] == this.node;
    }
  }

  /** Remove the node from its parent */
  remove() {
    if (this.parentPath) {
      if (this.listKey) {
        const nodes = (this.parentPath.node as any)[this.listKey] as BaseNode[];
        const nodeIndex = nodes.indexOf(this.node);
        if (nodeIndex > -1) {
          nodes.splice(nodeIndex, 1);
        } else {
          debugLog("Something went wrong when calling remove(), path's node is not available in nodes array");
        }
      } else if (this.key) {
        (this.parentPath.node as any)[this.key] = undefined;
      }
    } else {
      throw new Error('Can not remove a path which does not have a parent')
    }
  }
}
