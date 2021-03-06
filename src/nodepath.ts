import { Node, BaseNode } from 'estree';

import { TraverseOptions, Traverser, Visitors } from './traverse';
import { Scope } from './scope';
import { is } from './is';
import * as t from './generated/types';
import { NodePathDocs } from './nodepath-doc';
import { NodeT } from './internal-utils';

// * Tip: Fold the regions for better experience

const mapSet = <K, V>(map: Map<K, V>, key: K, value: V): V => {
  map.set(key, value);
  return value;
}

export class Context {
  pathCache = new Map<NodePath | null, Map<Node | null, NodePath>>();
  scopeCache = new Map<NodePath, Scope>();
  makeScope = false;
  private currentSkipPaths = new Set<NodePath>();
  private readonly skipPathSetStack = [this.currentSkipPaths];
  /** Store newly added nodes to this queue for traversal */
  private readonly queueStack: {
    new: NodePath[];
    unSkipped: NodePath[];
  }[] = [];

  constructor(options?: TraverseOptions) {
    this.makeScope = options?.scope === true;
  }

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

  pushToQueue(paths: NodePath[], stackName: keyof Context['queueStack'][number]) {
    const last = this.queueStack[this.queueStack.length - 1];
    if (last != null) last[stackName].push(...paths);
  }

  newQueue() {
    this.queueStack.push({
      new: [],
      unSkipped: []
    });
  }

  popQueue() {
    return this.queueStack.pop()!;
  }
}

type Keys<N extends Node> = Exclude<keyof N, keyof BaseNode>;
type PickKeysWithValue<N extends Node, Condition> = {
  [K in keyof N]: N[K] extends Condition ? K : never;
}[keyof N];

type NodePathData<T extends Node, P extends Node> = {
  node: NodePath<T>['node'];
  key: NodePath['key'];
  listKey: NodePath['listKey'];
  parentPath: NodePath<T, P>['parentPath'];
  ctx: Context;
};

export class NodePath<T extends Node = Node, P extends Node = Node> implements NodePathDocs {
  readonly node: T | null;
  readonly type: T['type'] | null;
  key: string | number | null;
  listKey: string | null;
  removed: boolean;
  readonly parentPath: NodePath<P> | null;
  readonly parent: P | null;
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
    this.scope = undefined;
  }

  /** Get the cached NodePath object or create new if cache is not available */
  static for<T extends Node = Node, P extends Node = Node>(data: NodePathData<T, P>): NodePath<T, P> {
    if (data.node == null) {
      // Don't cache a null NodePath
      return new this(data);
    }

    const pathCache = data.ctx.pathCache;
    const { parentPath } = data;
    const children = pathCache.get(parentPath) || mapSet(pathCache, parentPath, new Map<Node, NodePath>());
    return (children.get(data.node) || mapSet(children, data.node, new NodePath<any, any>(data)));
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

  get parentKey(): string | null {
    return this.listKey != null ? this.listKey : (this.key as string);
  }

  //#region Traversal

  skip() {
    this.ctx.setSkipped(this);
  }

  unSkip() {
    this.ctx.setNotSkipped(this);
    this.ctx.pushToQueue([this], 'unSkipped');
  }

  unskip() {
    this.unSkip();
  }

  traverse<S>(visitors: Visitors<S>, state?: S) {
    if (this.node == null) {
      throw new Error('Can not use method `traverse` on a null NodePath');
    }

    Traverser.traverseNode({
      node: this.node,
      parentPath: this.parentPath,
      visitors,
      state,
      ctx: this.ctx,
      expand: true
    });
  }

  //#endregion

  //#region Ancestry

  findParent<N extends Node>(predicate: (path: NodePath<N>) => boolean): NodePath<N> | null {
    let parent: NodePath<any> | null = this.parentPath;
    while (parent != null) {
      if (predicate(parent)) return parent;
      parent = parent.parentPath;
    }
    return null;
  }

  find<N extends Node>(predicate: (path: NodePath<N>) => boolean): NodePath<N> | null {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let nodePath: NodePath<any> | null = this;
    while (nodePath != null) {
      if (predicate(nodePath)) return nodePath;
      nodePath = nodePath.parentPath;
    }
    return null;
  }

  getFunctionParent(): NodePath<t.Function> | null {
    return this.findParent((p) => is.function(p));
  }

  //#endregion

  //#region Modification

  protected updateSiblingIndex(fromIndex: number, incrementBy: number): void {
    if ((this.container as any[]).length === 0) return;

    this.ctx.pathCache.get(this.parentPath)?.forEach((path) => {
      if ((path.key as number) >= fromIndex) {
        (path.key as number) += incrementBy;
      }
    });
  }

  insertBefore(nodes: readonly Node[]): NodePath[] {
    this.assertNotRemoved();

    // TODO: Handle more cases

    if (!Array.isArray(this.container)) {
      throw new Error('Can not insert before a node where `container` is not an Array');
    }

    const key = this.key as number;
    this.container.splice(key, 0, ...nodes);
    this.updateSiblingIndex(key, nodes.length);

    const newPaths = nodes.map((node, idx) => (
      NodePath.for({
        node,
        key: key + idx,
        listKey: this.listKey,
        parentPath: this.parentPath,
        ctx: this.ctx
      }).init()
    ));

    this.ctx.pushToQueue(newPaths, 'new');

    return newPaths;
  }

  insertAfter(nodes: readonly Node[]): NodePath[] {
    this.assertNotRemoved();

    // TODO: Handle more cases

    if (!Array.isArray(this.container)) {
      throw new Error('Can not insert after a node where `container` is not an Array');
    }

    const key = this.key as number;
    this.container.splice(key + 1, 0, ...nodes);
    this.updateSiblingIndex(key + 1, nodes.length);

    const newPaths = nodes.map((node, idx) => (
      NodePath.for({
        node,
        key: key + idx + 1,
        listKey: this.listKey,
        parentPath: this.parentPath,
        ctx: this.ctx
      }).init()
    ));

    this.ctx.pushToQueue(newPaths, 'new');

    return newPaths;
  }

  unshiftContainer<K extends PickKeysWithValue<T, Node[]>>(
    listKey: K extends never ? string : K,
    nodes: Readonly<K extends never ? Node[] : T[K]>
  ): NodePath<
    K extends never
      ? Node
      : T[K] extends Node[] ? T[K][number] : Node,
    T
  >[];
  unshiftContainer(listKey: string, nodes: readonly Node[]): NodePath[] {
    this.assertNotRemoved();

    const firstNode = (this.node as any as Record<string, Node[]>)[listKey][0];
    // Create a virtual NodePath
    const lastNodePath = NodePath.for({
      node: firstNode,
      key: 0,
      listKey,
      parentPath: this,
      ctx: this.ctx
    });
    const newPaths = lastNodePath.insertBefore(nodes);

    this.ctx.pushToQueue(newPaths, 'new');

    return newPaths;
  }

  pushContainer<K extends PickKeysWithValue<T, Node[]>>(
    listKey: K extends never ? string : K,
    nodes: Readonly<K extends never ? Node[] : T[K]>
  ): NodePath<
    K extends never
      ? Node
      : T[K] extends Node[] ? T[K][number] : Node,
    T
  >[];
  pushContainer(listKey: string, nodes: readonly Node[]): NodePath[] {
    this.assertNotRemoved();

    const container = (this.node as any as Record<string, Node[]>)[listKey];
    const lastNode = container[container.length - 1];
    // Create a virtual NodePath
    const lastNodePath = NodePath.for({
      node: lastNode,
      key: container.length - 1,
      listKey,
      parentPath: this,
      ctx: this.ctx
    });
    const newPaths = lastNodePath.insertAfter(nodes);

    this.ctx.pushToQueue(newPaths, 'new');

    return newPaths;
  }

  //#endregion

  //#region Family
  
  get<K extends Keys<T>>(
    key: K
  ): T[K] extends (infer U | null)[]
    ? U extends Node ? NodePath<U, T>[] : NodePath<never, T>[]
    : T[K] extends Node ? NodePath<T[K], T> : NodePath<never, T>;
  get<N extends Node | Node[] | unknown = unknown>(
    key: string
  ): unknown extends N
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

  getOpposite() {
    switch (this.key) {
      case 'left': return this.getSibling('right');
      case 'right': return this.getSibling('left');
    }
  }

  getPrevSibling(): NodePath | undefined | never {
    return this.getSibling((this.key as number) - 1);
  }

  getNextSibling(): NodePath | undefined | never {
    return this.getSibling((this.key as number) + 1);
  }

  getAllPrevSiblings(): NodePath[] | undefined | never {
    if (this.parentPath == null) {
      this.throwNoParent('getAllPrevSiblings');
    }

    return this.parentPath
      .get<Node[]>(this.listKey as string)
      .slice(0, this.key as number)
      .reverse();
  }

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

  has(key: Keys<T> extends never ? string : Keys<T>): boolean;
  has(key: any): boolean {
    const value = (this.node as Record<string, any>)?.[key];
    if (value != null && Array.isArray(value) && value.length === 0) {
      return false;
    }
    return !!value;
  }

  is(key: Keys<T> extends never ? string : Keys<T>): boolean;
  is(key: any): boolean {
    return !!(this.node as Record<string, any>)?.[key];
  }

  //#endregion

  //#region Removal

  private onRemove(): boolean {
    const { parent, key, listKey } = this;
    const parentT = parent!.type;
    const parentPath = this.parentPath!;

    switch (true) {
      case parentT === 'ExpressionStatement' && key === 'expression':
      case is.exportDeclaration(parent) && key === 'declaration':
      case (parentT === 'WhileStatement' || parentT === 'SwitchCase') && key === 'test':
      case parentT === 'LabeledStatement' && key === 'body':
      case (parentT === 'VariableDeclaration' && listKey === 'declarations' && (parent as NodeT<'VariableDeclaration'>).declarations.length === 1):
        parentPath.remove();
        return true;

      case parentT === 'BinaryExpression':
        parentPath.replaceWith(
          (parent as NodeT<'BinaryExpression'>)[key === 'right' ? 'left' : 'right']
        );
        return true;
      
      case parentT === 'IfStatement' && key === 'consequent':
      case (parentT === 'ArrowFunctionExpression' || is.loop(parent)) && key === 'body':
        if (parentT === 'ArrowFunctionExpression') {
          (parent as NodeT<'ArrowFunctionExpression'>).expression = false;
        }
        this.replaceWith({
          type: 'BlockStatement',
          body: []
        });
        return true;
    }

    return false;
  }

  private markRemoved() {
    this.ctx.pathCache.get(this.parentPath)?.delete(this.node);
    this.removed = true;
  }

  remove(): void {
    if (this.removed) {
      throw new Error('Node is already removed');
    }

    if (this.container == null) {
      this.throwNoParent('remove');
    }

    if (this.onRemove()) {
      // Things are handled by `onRemove` function.
      return this.markRemoved();
    }

    if (this.listKey != null) {
      const key = this.key as number;
      const container = this.container as Node[];
      container.splice(key, 1);
      this.markRemoved();
      this.updateSiblingIndex(key + 1, -1);
    } else if (this.key != null) {
      (this.container as any as Record<string, Node | null>)[this.key] = null;
      this.markRemoved();
    }
  }

  //#endregion

  //#region Replacement

  replaceWith<N extends Node = Node>(node: N): NodePath<N> {
    if (this.container == null) {
      this.throwNoParent('replaceWith');
    }

    (this.container as any as Record<string | number, Node>)[this.key!] = node;
    this.markRemoved();

    const newPath = NodePath.for({
      node,
      key: this.key,
      listKey: this.listKey,
      parentPath: this.parentPath,
      ctx: this.ctx
    }).init();

    this.ctx.pushToQueue([newPath], 'new');

    return newPath;
  }

  replaceWithMultiple<N extends readonly Node[]>(nodes: N): NodePath<N[number]>[] {
    if (this.container == null) {
      this.throwNoParent('replaceWith');
    }

    const newPath = this.replaceWith(nodes[0]);
    return [newPath].concat(newPath.insertAfter(nodes.slice(1)));
  } 

  //#endregion
}
