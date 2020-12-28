import { Node, BaseNode } from 'estree';

import { TraverseOptions, Traverser, Visitors } from './traverse';
import { Scope } from './scope';
import { is } from './is';
import * as t from './generated/types';


// * Tip: Fold the regions or comments for better experience

const mapSet = <K, V>(map: Map<K, V>, key: K, value: V): V => {
  map.set(key, value);
  return value;
}

export class Context {
  pathCache = new Map<Node | null, Map<Node | null, NodePath>>();
  scopeCache = new Map<NodePath, Scope>();
  makeScope = true;
  private currentSkipPaths = new Set<NodePath>();
  private readonly skipPathSetStack = [this.currentSkipPaths];

  setSkipped(path: NodePath) {
    this.currentSkipPaths.add(path);
  }

  setNotSkipped(path: NodePath) {
    this.currentSkipPaths.delete(path);
  }

  shouldSkip(path: NodePath) {
    return this.currentSkipPaths.has(path);
  }

  private updateCurrentSkipPaths() {
    this.currentSkipPaths = this.skipPathSetStack[this.skipPathSetStack.length - 1];
  }

  newSkipPathStack() {
    this.skipPathSetStack.push(new Set());
    this.updateCurrentSkipPaths();
  }

  restorePrevSkipPathStack() {
    this.skipPathSetStack.pop();
    this.updateCurrentSkipPaths();
  }
}

type NodePathData<T extends Node, P extends Node> = {
  node: NodePath<T>['node'];
  key: NodePath['key'];
  listKey: NodePath['listKey'];
  parentPath: NodePath<T, P>['parentPath'];
  ctx: Context;
};

export class NodePath<T extends Node = Node, P extends Node = Node> {
  /** The node associated with the current NodePath */
  readonly node: T | null;
  /** Type of the node that is associated with this NodePath */
  readonly type: T['type'] | null;
  /**
   * The current node's key in its parent
   * 
   * Example
   * ```
   * const ast = {
   *   type: 'IfStatement',
   *   test: {
   *     type: 'Identifier',
   *     name: 'targetNode'
   *   },
   *   consequent: {
   *     type: 'EmptyStatement'
   *   },
   *   alternate: null
   * };
   *
   * traverse(ast, {
   *   Identifier(path) {
   *     if (path.node.name === 'targetNode') {
   *       path.key === 'test' // => true
   *     }
   *   }
   * });
   * ```
   */
  key: string | number | null;
  /**
   * If this node is part of an array, `listKey` is the key of the array in its parent
   * 
   * Example
   * ```
   * const ast = {
   *   type: 'ArrayExpression',
   *   elements: [
   *     {
   *       type: 'Identifier',
   *       name: 'targetNode'
   *     }
   *   ]
   * };
   * 
   * traverse(ast, {
   *   Identifier(path) {
   *     if (path.node.name === 'targetNode') {
   *       path.listKey === 'elements' // => true
   *       path.key === 0 // => true
   *     }
   *   }
   * });
   * ```
   */
  listKey: string | null;
  /** If the node has been removed from its parent */
  removed: boolean;
  /** The parent path of the current NodePath */
  readonly parentPath: NodePath<P> | null;
  /** The parent node of the current NodePath */
  readonly parent: P | null;
  /**
   * Container of the node
   * 
   * Example - 1
   * ```
   * const ast = {
   *   type: 'ArrayExpression',
   *   elements: [
   *     {
   *       type: 'Identifier',
   *       name: 'targetNode'
   *     }
   *   ]
   * };
   * 
   * traverse(ast, {
   *   Identifier(path) {
   *     if (path.node.name === 'targetNode') {
   *       path.container === ast.elements // => true
   *     }
   *   }
   * });
   * ```
   * 
   * Example - 2
   * ```
   * const ast = {
   *   type: 'IfStatement',
   *   test: {
   *     type: 'Identifier',
   *     name: 'targetNode'
   *   },
   *   consequent: {
   *     type: 'EmptyStatement'
   *   },
   *   alternate: null
   * };
   * 
   * traverse(ast, {
   *   Identifier(path) {
   *     if (path.node.name === 'targetNode') {
   *       path.container === ast // => true
   *     }
   *   }
   * });
   * ```
   */
  readonly container: P | Node[] | null;

  readonly ctx: Context;
  scope: Scope | undefined | null;

  private constructor(data: NodePathData<T, P>) {
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

    this.ctx = data.ctx;
  }

  /** Get the cached NodePath object or create new if cache is not available */
  static for<T extends Node = Node, P extends Node = Node>(data: NodePathData<T, P>) {
    const pathCache = data.ctx.pathCache;
    const parentNode = data.parentPath && data.parentPath.node;
    const children = pathCache.get(parentNode) || mapSet(pathCache, parentNode, new Map<Node, NodePath>());
    return (children.get(data.node) || mapSet(children, data.node, new this(data))) as NodePath<T, P>;
  }

  init() {
    this.scope = this.ctx.makeScope ? Scope.for(this, this.parentPath?.scope || null) : null;
    if (this.scope != null) this.scope.init();
    return this;
  }

  protected throwNoParent(methodName: string): never {
    throw new Error(`Can not use \`${methodName}\` on a NodePath which does not have a parent`);
  }

  protected assertNotRemoved(): void {
    if (this.removed) {
      throw new Error('Path is removed and it is now read-only');
    }
  }

  //#region Traversal

  skip() {
    this.ctx.setSkipped(this);
  }

  traverse<S>(visitors: Visitors<S> & { $: TraverseOptions }, state?: S) {
    if (this.node == null) {
      throw new Error('Can not use method `traverse` on a null NodePath');
    }

    Traverser.traverseNode({
      node: this.node,
      parentPath: this.parentPath,
      visitors,
      options: visitors.$,
      state
    });
  }

  //#endregion

  //#region Ancestry

  /**
   * Starting at the parent path of this `NodePath` and going up the tree,
   * returns first parent path where `predicate` is true
   * 
   * Example
   * ```
   * const ast = {
   *   type: 'BlockStatement',
   *   body: [
   *     {
   *       type: 'BlockStatement',
   *       body: [
   *         {
   *           type: 'ExpressionStatement',
   *           expression: {
   *             type: 'Literal',
   *             value: 0
   *           }
   *         }
   *       ]
   *     }
   *   ]
   * };
   * 
   * traverse(ast, {
   *   Literal(path) {
   *     const blockParent = path.findParent(
   *       (parent) => parent.type === 'BlockStatement'
   *     ).node;
   *     blockParent === ast.body[0] // => true, Notice how it is not `ast` and is `ast.body[0]`
   *   }
   * });
   * ```
   */
  findParent<N extends Node>(predicate: (path: NodePath<N>) => boolean): NodePath<N> | null {
    let parent: NodePath<any> | null = this.parentPath;
    while (parent != null) {
      if (predicate(parent)) return parent;
      parent = parent.parentPath;
    }
    return null;
  }

  /**
   * Starting from **this** `NodePath` and going up the tree,
   * returns the first `NodePath` where `predicate` is true
   * 
   * Example
   * ```
   * const ast = {
   *   type: 'ExpressionStatement',
   *   expression: {
   *     type: 'Literal',
   *     value: 0
   *   }
   * };
   * 
   * traverse(ast, {
   *   Literal(path) {
   *     path.find((p) => p.type === 'Literal').node === ast.expression // => true
   *     path.find((p) => p.type === 'ExpressionStatement').node === ast // => true
   *   }
   * });
   * ```
   */
  find<N extends Node>(predicate: (path: NodePath<N>) => boolean): NodePath<N> | null {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let nodePath: NodePath<any> | null = this;
    while (nodePath != null) {
      if (predicate(nodePath)) return nodePath;
      nodePath = nodePath.parentPath;
    }
    return null;
  }

  /** Get the closest function parent */
  getFunctionParent(): NodePath<t.Function> | null {
    return this.findParent((p) => is.function(p));
  }

  //#endregion

  //#region Modification

  protected updateSiblingIndex(fromIndex: number, incrementBy: number): void {
    if ((this.container as any[]).length === 0) return;

    this.ctx.pathCache.get(this.parent)?.forEach((path) => {
      if ((path.key as number) >= fromIndex) {
        (path.key as number) += incrementBy;
      }
    });
  }

  /** Inserts the `nodes` before the current node */
  insertBefore(nodes: readonly Node[]): NodePath[] {
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
          ctx: this.ctx
        }).init()
      ));
    } else {
      throw new Error('Can not insert before a node where `container` is not an Array');
    }
  }

  /** Inserts the `nodes` after the current node */
  insertAfter(nodes: readonly Node[]): NodePath[] {
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
          ctx: this.ctx
        }).init()
      ));
    } else {
      throw new Error('Can not insert after a node where `container` is not an Array');
    }
  }

  /** Insert child nodes at the start of the container */
  unshiftContainer(listKey: string, nodes: readonly Node[]): NodePath[] {
    this.assertNotRemoved();

    const firstNode = (this.node as any as Record<string, Node[]>)[listKey][0];
    // Create a virtual NodePath
    return NodePath.for({
      node: firstNode,
      key: 0,
      listKey,
      parentPath: this,
      ctx: this.ctx
    }).insertBefore(nodes);
  }

  /** Insert the child nodes at the end of the container */
  pushContainer(listKey: string, nodes: readonly Node[]): NodePath[] {
    this.assertNotRemoved();

    const container = (this.node as any as Record<string, Node[]>)[listKey];
    const lastNode = container[container.length - 1];
    // Create a virtual NodePath
    return NodePath.for({
      node: lastNode,
      key: container.length - 1,
      listKey,
      parentPath: this,
      ctx: this.ctx
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
          ctx: this.ctx
        }).init()
      )) as NodePath[];
    } else if (value != null && typeof value.type == 'string') {
      return NodePath.for({
        node: value as any as Node,
        key: key,
        listKey: null,
        parentPath: this as any as NodePath,
        ctx: this.ctx
      }).init() as NodePath;
    }

    return NodePath.for({
      node: null,
      key: key,
      listKey: null,
      parentPath: this as any as NodePath,
      ctx: this.ctx
    }).init() as NodePath;
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

  //#region Introspection

  has(key: Exclude<keyof T, keyof BaseNode>): boolean {
    const value = this.node?.[key];
    if (value != null && Array.isArray(value) && value.length === 0) {
      return false;
    }
    return !!value;
  }

  is(key: Exclude<keyof T, keyof BaseNode>): boolean {
    return !!this.node?.[key];
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
      container.splice(key, 1);
      this.ctx.pathCache.get(this.parent)?.delete(this.node);
      this.updateSiblingIndex(key + 1, -1);
      this.removed = true;
    } else if (this.key != null) {
      (this.container as any as Record<string, Node | null>)[this.key] = null;
      this.ctx.pathCache.get(this.parent)?.delete(this.node);
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
    this.ctx.pathCache.get(this.parent)?.delete(this.node);
    this.removed = true;

    return NodePath.for({
      node,
      key: this.key,
      listKey: this.listKey,
      parentPath: this.parentPath,
      ctx: this.ctx
    }).init();
  }

  /** Removes the old node and inserts the new nodes in the old node's position */
  replaceWithMultiple<N extends readonly Node[]>(nodes: N): NodePath<N[number]>[] {
    if (this.container == null) {
      this.throwNoParent('replaceWith');
    }

    const newPath = this.replaceWith(nodes[0]);

    return [newPath].concat(newPath.insertAfter(nodes.slice(1)));
  } 

  //#endregion
}
