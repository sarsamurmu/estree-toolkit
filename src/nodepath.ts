import {
  ArrowFunctionExpression,
  FunctionDeclaration,
  FunctionExpression,
  Node,
  BaseNode
} from 'estree';

import { debugLog } from './utils';

const mapSet = <K, V>(map: Map<K, V>, key: K, value: V): V => {
  map.set(key, value);
  return value;
}

const internal = Symbol('__internal__');

export class NodePath<T extends Node = Node> {
  /** The node associated with the current NodePath */
  node: T | null;
  /** Type of the node that is associated with this NodePath */
  type: T['type'] | null;
  /** The current node's key in its parent */
  key: string | number | null;
  /** If this node is part of an array, `listKey` is the key of the array in its parent */
  listKey: string | null;
  /** The parent path of the current NodePath */
  parentPath: NodePath | null;
  /** The parent node of the current NodePath */
  parent: Node | null;
  /** Container of the node
   * Value is `this.parent[this.listKey]` if `this.listKey` is truthy, else `this.parent`
   */
  container: Node | Node[] | null;
  /** If the node has been removed from its parent */
  removed: boolean;

  protected [internal]: {
    pathCache: Map<Node | null, Map<Node | null, NodePath>>;
  }

  protected static internalSymbol = internal;

  constructor(data: {
    node: NodePath<T>['node'];
    key: NodePath['key'];
    listKey: NodePath['listKey'];
    parentPath: NodePath['parentPath'];
    internal: NodePath[typeof internal];
  }) {
    this.node = data.node;
    this.type = this.node && this.node.type;
    this.key = data.key;
    this.listKey = data.listKey;
    this.parentPath = data.parentPath;
    this.parent = this.parentPath && this.parentPath.node;
    this.container = this.listKey
      ? (this.parent as any as Record<string, Node[]>)[this.listKey]
      : this.parent;
    this.removed = false;

    this[internal] = data.internal;
  }

  /** Get the cached NodePath object or create new if cache is not available */
  static for<N extends Node = Node>(data: ConstructorParameters<typeof NodePath>[0]) {
    const pathCache = data.internal.pathCache;
    const parentNode = data.parentPath && data.parentPath.node;
    const children = pathCache.get(parentNode) || mapSet(pathCache, parentNode, new Map<Node, NodePath>());
    return (children.get(data.node) || mapSet(children, data.node, new this(data))) as NodePath<N>;
  }

  protected throwNoParent(methodName: string): never {
    throw new Error(`Can not use \`${methodName}\` on a NodePath which does not have a parent`);
  }

  protected assertNotRemoved(): void {
    if (this.removed) {
      throw new Error('Path is removed and it is now read-only');
    }
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

  /** Starting from **this** `NodePath` and going up the tree,
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
    )) as NodePath<FunctionDeclaration | FunctionExpression | ArrowFunctionExpression>;
  }

  //#endregion

  //#region Modification

  protected updateSiblingIndex(fromIndex: number, incrementBy: number): void {
    this[internal].pathCache.get(this.parent)?.forEach((path) => {
      if ((path.key as number) >= fromIndex) {
        (path.key as number) += incrementBy;
      }
    });
  }

  /** Inserts the `nodes` before the current node */
  insertBefore(nodes: Node[]): NodePath[] {
    this.assertNotRemoved();

    // TODO: Handle more cases

    if (Array.isArray(this.container)) {
      const key = this.key as number;
      this.container.splice(key, 0, ...nodes);
      this.updateSiblingIndex(key, nodes.length);

      return nodes.map((node, idx) => (
        NodePath.for({
          node,
          key: key + idx,
          listKey: this.listKey,
          parentPath: this.parentPath,
          internal: this[internal]
        })
      ));
    } else {
      throw new Error('Can not insert before a node where `container` is not an Array');
    }
  }

  /** Inserts the `nodes` after the current node */
  insertAfter(nodes: Node[]): NodePath[] {
    this.assertNotRemoved();

    // TODO: Handle more cases

    if (Array.isArray(this.container)) {
      const key = this.key as number;
      this.container.splice(key + 1, 0, ...nodes);
      this.updateSiblingIndex(key + 1, nodes.length);
      
      return nodes.map((node, idx) => (
        NodePath.for({
          node,
          key: key + idx + 1,
          listKey: this.listKey,
          parentPath: this.parentPath,
          internal: this[internal]
        })
      ));
    } else {
      throw new Error('Can not insert after a node where `container` is not an Array');
    }
  }

  /** Insert child nodes at the start of the container */
  unshiftContainer(listKey: string, nodes: Node[]): NodePath[] {
    this.assertNotRemoved();

    const firstNode = (this.node as any as Record<string, Node[]>)[listKey][0];
    return NodePath.for({
      node: firstNode,
      key: 0,
      listKey,
      parentPath: this,
      internal: this[internal]
    }).insertBefore(nodes);
  }

  /** Insert the child nodes at the end of the container */
  pushContainer(listKey: string, nodes: Node[]): NodePath[] {
    this.assertNotRemoved();

    const container = (this.node as any as Record<string, Node[]>)[listKey];
    const lastNode = container[container.length - 1];
    return NodePath.for({
      node: lastNode,
      key: container.length - 1,
      listKey,
      parentPath: this,
      internal: this[internal]
    }).insertAfter(nodes);
  }

  //#endregion

  //#region Family

  /** Get the children NodePath for which the key is `key` */
  get<K extends Exclude<keyof T, keyof BaseNode>>(
    key: K
  ): T[K] extends Node[]
    ? NodePath<T[K][number]>[]
    : T[K] extends Node ? NodePath<T[K]> : NodePath<never>;
  get<N extends Node | Node[] | null = null>(
    key: string
  ): null extends N
    ? NodePath | NodePath[]
    : N extends Node[]
      ? NodePath<N[number]>[]
      : N extends Node ? NodePath<N> : NodePath<never>;
  
  get(key: string): NodePath | NodePath[] {
    if (this.node == null) {
      throw new Error('Can not use method `get` on a null NodePath');
    }

    const value = (this.node as any as Record<string, Node | Node[] | null>)[key];

    if (Array.isArray(value)) {
      return value.map((node, index) => (
        NodePath.for({
          node,
          key: index,
          listKey: key,
          parentPath: this as any as NodePath,
          internal: this[internal]
        })
      )) as NodePath[];
    } else if (value != null && typeof value.type == 'string') {
      return NodePath.for({
        node: value as any as Node,
        key: key,
        listKey: null,
        parentPath: this as any as NodePath,
        internal: this[internal]
      }) as NodePath;
    }

    return NodePath.for({
      node: null,
      key: key,
      listKey: null,
      parentPath: this as any as NodePath,
      internal: this[internal]
    }) as NodePath;
  }

  /** Get the NodePath of its sibling for which the key is `key` */
  getSibling<N extends Node = Node>(key: string | number): NodePath<N> | undefined | never {
    if (this.parentPath == null) {
      this.throwNoParent('getSibling');
    }

    if (typeof key === 'string') {
      return this.parentPath.get(key) as NodePath<N>;
    } else if (this.listKey != null) {
      return (this.parentPath.get(this.listKey) as NodePath[])[key] as NodePath<N>;
    }
  }

  /** Get the opposite NodePath */
  getOpposite() {
    switch (this.key) {
      case 'left': return this.getSibling('right');
      case 'right': return this.getSibling('left');
    }
  }

  /** The the previous sibling of the current node */
  getPrevSibling(): NodePath | undefined | never {
    return this.getSibling((this.key as number) - 1);
  }

  /** The the next sibling of the current node */
  getNextSibling(): NodePath | undefined | never {
    return this.getSibling((this.key as number) + 1);
  }

  /** Get all previous siblings of the current node */
  getAllPrevSiblings(): NodePath[] | undefined | never {
    if (this.parentPath == null) {
      this.throwNoParent('getAllPrevSiblings');
    }

    return this.parentPath
      .get<Node[]>(this.listKey as string)
      .slice(0, this.key as number)
      .reverse();
  }

  /** Get all next siblings of the current node */
  getAllNextSiblings(): NodePath[] | undefined | never {
    if (this.parentPath == null) {
      this.throwNoParent('getAllNextSiblings');
    }

    return this.parentPath
      .get<Node[]>(this.listKey as string)
      .slice((this.key as number) + 1);
  }

  //#endregion

  //#region Removal

  /** Remove the node from its parent */
  remove(): void {
    if (this.removed) {
      throw new Error('Node is already removed');
    }

    if (this.container == null) {
      this.throwNoParent('remove');
    }

    if (this.listKey != null) {
      const key = this.key as number;
      const container = this.container as Node[];

      if (container[key] === this.node) {
        container.splice(key, 1);
        this[internal].pathCache.get(this.parent)?.delete(this.node);
        this.updateSiblingIndex(key + 1, -1);
        this.removed = true;
      } else {
        debugLog("Something went wrong when calling remove(), path's node is not available in its index");
      }
    } else if (this.key != null) {
      (this.container as any as Record<string, Node | null>)[this.key] = null;
      this.removed = true;
    }
  }

  //#endregion

  //#region Replacement

  /** Removes the old node and inserts the new node in the old node's position */
  replaceWith<N extends Node = Node>(node: N): NodePath<N> {
    if (this.container == null) {
      this.throwNoParent('replaceWith');
    }

    (this.container as any as Record<string | number, Node>)[this.key!] = node;
    this[internal].pathCache.get(this.parent)?.delete(this.node);
    this.removed = true;

    return NodePath.for({
      node,
      key: this.key,
      listKey: this.listKey,
      parentPath: this.parentPath,
      internal: this[internal]
    });
  }

  /** Removes the old node and inserts the new nodes in the old node's position */
  replaceWithMultiple<N extends Node[]>(nodes: N): NodePath<N[number]>[] {
    if (this.container == null) {
      this.throwNoParent('replaceWith');
    }

    const newPath = this.replaceWith(nodes[0]);

    return [newPath].concat(newPath.insertAfter(nodes.slice(1)));
  } 

  //#endregion
}
