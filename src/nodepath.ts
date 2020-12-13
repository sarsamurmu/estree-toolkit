import { ArrowFunctionExpression, FunctionDeclaration, FunctionExpression, Node } from 'estree';

import { debugLog } from './utils';

const mapSet = <K, V>(map: Map<K, V>, key: K, value: V): V => {
  map.set(key, value);
  return value;
}

const internal = Symbol();

export class NodePath<T extends Node = Node> {
  /** The node associated with this NodePath */
  node: T;
  /** Type of the node that is associated with this NodePath */
  type: T['type'];
  /** This node's key in its parent */
  key: Node['type'] | number;
  /** If this node is part of an array, `listKey` is the key of the array in its parent */
  listKey: Node['type'] | null;
  /** Get the parent path of this NodePath */
  parentPath: NodePath | null;
  /** Get the parent node of this node */
  parent: Node | null;
  /** Container of the node */
  container: Node | Node[] | null;
  /** If the node has been removed from its parent */
  removed: boolean;

  [internal]: {
    pathCache: Map<Node | null, Map<Node, NodePath>>;
  }

  constructor(data: {
    node: NodePath<T>['node'];
    key: NodePath['key'];
    listKey: NodePath['listKey'];
    parentPath: NodePath['parentPath'];
    internal: NodePath[typeof internal];
  }) {
    this.node = data.node;
    this.type = this.node.type;
    this.key = data.key;
    this.listKey = data.listKey;
    this.parentPath = data.parentPath;
    this.parent = this.parentPath && this.parentPath.node;
    this.container = this.listKey ? (this.parent as any)[this.listKey] : this.parent;
    this.removed = false;

    this[internal] = data.internal;
  }

  static get(data: ConstructorParameters<typeof NodePath>[0]) {
    const pathCache = data.internal.pathCache;
    const parentNode = data.parentPath && data.parentPath.node;
    const children = pathCache.get(parentNode) || mapSet(pathCache, parentNode, new Map<Node, NodePath>());
    return children.get(data.node) || mapSet(children, data.node, new this(data));
  }

  //#region Ancestry

  /**
   * Starting at the parent path of this `NodePath` and going up the tree,
   * returns first parent path where `predicate` is true
   */
  findParent(predicate: (path: NodePath) => boolean): NodePath | null {
    let parent = this.parentPath;
    while (parent != null) {
      if (predicate(parent)) return parent;
      parent = parent.parentPath;
    }
    return null;
  }

  /** Starting from this `NodePath` and going up the tree,
   * returns the first `NodePath` where `predicate` is true
   */
  find(predicate: (path: NodePath) => boolean): NodePath | null {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let nodePath: NodePath | null = this;
    while (nodePath != null) {
      if (predicate(nodePath)) return nodePath;
      nodePath = nodePath.parentPath;
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
          
          // ! TODO: Update sibling index
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
