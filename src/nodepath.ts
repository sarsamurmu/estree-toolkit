import { ArrowFunctionExpression, FunctionDeclaration, FunctionExpression, Node } from 'estree';

import { debugLog } from './utils';

export class NodePath<T extends Node = Node> {
  /** The node associated with this NodePath */
  node: T;
  /** This node's key in its parent */
  key: Node['type'] | number;
  /** If this node is part of an array, `listKey` is the key of the array in its parent */
  listKey: Node['type'] | null;
  /** Get the parent path of this path */
  parentPath: NodePath | null;
  /** Type of the node that is associated with this NodePath */
  type: T['type'];
  /** If the node has been removed from its parent */
  removed: boolean;

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
    this.removed = false;
  }

  //#region Ancestry

  /**
   * Starting at the parent path of this NodePath and going up the tree,
   * returns first parent path where predicate is true
   */
  findParent(predicate: (path: NodePath) => boolean): NodePath | null {
    let parent = this.parentPath;
    while (parent != null) {
      if (predicate(parent)) return parent;
      parent = parent.parentPath;
    }
    return null;
  }

  /** Get the closest function parent */
  getFunctionParent(): NodePath<FunctionDeclaration | FunctionExpression | ArrowFunctionExpression> | null {
    return this.findParent(({ type }) => (
      type === 'FunctionDeclaration' ||
      type === 'FunctionExpression' ||
      type === 'ArrowFunctionExpression'
    )) as any;
  }

  //#endregion

  //#region Removal

  /** Remove the node from its parent */
  remove(): void {
    if (this.removed) return;
    if (this.parentPath) {
      if (this.listKey) {
        const nodes = (this.parentPath.node as any)[this.listKey] as Node[];
        const index = this.key as number;
        if (nodes[index] === this.node) {
          nodes.splice(index, 1);
          this.removed = true;

          // ! Update sibling index
        } else {
          debugLog("Something went wrong when calling remove(), path's node is not available in its index");
        }
      } else {
        (this.parentPath.node as any)[this.key] = null;
        this.removed = true;
      }
    } else {
      throw new Error('Can not remove a path which does not have a parent')
    }
  }

  //#endregion
}
