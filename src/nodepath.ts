import { Node } from 'estree';

import { debugLog } from './utils';

export class NodePath<T extends Node = Node> {
  /** The node associated with this NodePath */
  node: T;
  /** This node's key in its parent */
  key: string | number;
  /** If this node is part of an array, `listKey` is the key of the array in its parent */
  listKey: string | null;
  /** Get the parent path of this path */
  parentPath: NodePath | null;
  /** Type of the node that is associated with this NodePath */
  type: T['type'];

  constructor(data: {
    node: NodePath<T>['node'];
    key: NodePath['key'];
    listKey: NodePath['listKey'];
    parentPath: NodePath['parentPath']
  }) {
    this.node = data.node;
    this.key = data.key;
    this.listKey = data.listKey;
    this.parentPath = data.parentPath;
    this.type = this.node.type;
  }

  /* Things related to removal */

  /** If the node has been removed from its parent */
  isRemoved() {
    if (!this.parentPath) return false;
    if (this.listKey) {
      return ((this.parentPath.node as any)[this.listKey] as Node[]).indexOf(this.node) > -1;
    } else if (this.key) {
      return (this.parentPath.node as any)[this.key] === this.node;
    }
  }

  /** Remove the node from its parent */
  remove() {
    if (this.parentPath) {
      if (this.listKey) {
        const nodes = (this.parentPath.node as any)[this.listKey] as Node[];
        const nodeIndex = nodes.indexOf(this.node);
        if (nodeIndex > -1) {
          nodes.splice(nodeIndex, 1);
        } else {
          debugLog("Something went wrong when calling remove(), path's node is not available in nodes array");
        }
      } else if (this.key) {
        (this.parentPath.node as any)[this.key] = null;
      }
    } else {
      throw new Error('Can not remove a path which does not have a parent')
    }
  }
}
