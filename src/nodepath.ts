import { Node, BaseNode, NodeT, ParentsOf, NodeTypes } from './helpers'
import { TraverseOptions, Traverser, Visitors } from './traverse'
import { Scope } from './scope'
import { is } from './is'
import * as t from './generated/types'
import { NodePathDocs } from './nodepath-doc'
import { Definition, definitions, visitorKeys } from './definitions'
import { getNodeValidationEnabled } from './builders'

// * Tip: Fold the regions for better experience

const mapSet = <K, V>(map: Map<K, V>, key: K, value: V): V => {
  map.set(key, value)
  return value
}

declare const structuredClone: (x: any) => any

export class Context {
  /**
   * Don't depend on `pathCache` to get children,
   * because it may not be initialized when you call it
   */
  pathCache = new Map<NodePath | null, Map<Node | null, NodePath>>()
  scopeCache = new Map<NodePath, Scope>()
  makeScope = false
  shouldValidateNodes = getNodeValidationEnabled()
  cloneFunction = (node: any): any => structuredClone(node)
  private currentSkipPaths = new Set<NodePath>()
  private readonly skipPathSetStack = [this.currentSkipPaths]
  /** Store newly added nodes to this queue for traversal */
  private readonly queueStack: {
    new: NodePath[];
    unSkipped: NodePath[];
  }[] = []

  constructor(options?: TraverseOptions) {
    this.makeScope = options?.scope === true
    if (options?.validateNodes != null) {
      this.shouldValidateNodes = options.validateNodes
    }
    if (typeof options?.cloneFunction === 'function') {
      this.cloneFunction = options.cloneFunction
    }
  }

  setSkipped(path: NodePath) {
    this.currentSkipPaths.add(path)
  }

  setNotSkipped(path: NodePath) {
    this.currentSkipPaths.delete(path)
  }

  shouldSkip(path: NodePath) {
    return this.currentSkipPaths.has(path)
  }

  private updateCurrentSkipPaths() {
    this.currentSkipPaths = this.skipPathSetStack[this.skipPathSetStack.length - 1]
  }

  newSkipPathStack() {
    this.skipPathSetStack.push(new Set())
    this.updateCurrentSkipPaths()
  }

  restorePrevSkipPathStack() {
    this.skipPathSetStack.pop()
    this.updateCurrentSkipPaths()
  }

  pushToQueue(paths: NodePath[], stackName: keyof Context['queueStack'][number]) {
    const last = this.queueStack[this.queueStack.length - 1]
    if (last != null) last[stackName].push(...paths)
  }

  newQueue() {
    this.queueStack.push({
      new: [],
      unSkipped: []
    })
  }

  popQueue() {
    return this.queueStack.pop()!
  }
}

const runInsertionValidation = (node: Node, key: string | number, listKey: string | null, parent: Node) => {
  if (!getNodeValidationEnabled()) return
  const definition: Definition = definitions[node.type] as any
  if (definition != null && definition.insertionValidate != null) {
    const errorMsg = definition.insertionValidate(node, key, listKey, parent as ParentsOf<Node>)
    if (errorMsg != null) {
      throw new Error(errorMsg)
    }
  }
}

type Keys<N extends Node> = Exclude<keyof N, keyof BaseNode>
type PickKeysWithValue<N extends Node, Condition> = {
  [K in keyof N]: N[K] extends Condition ? K : never;
}[keyof N]

type NodePathData<T extends Node, P extends Node> = {
  node: NodePath<T>['node'];
  key: NodePath['key'];
  listKey: NodePath['listKey'];
  parentPath: NodePath<T, P>['parentPath'];
  ctx: Context;
}

export type NodePathT<N extends NodeTypes, P extends NodeTypes | null = null> =
  NodePath<NodeT<N>, null extends P ? Node : NodeT<Exclude<P, null>>>

export class NodePath<T extends Node = Node, P extends Node = Node> implements NodePathDocs {
  readonly node: T | null
  readonly type: T['type'] | null
  key: string | number | null
  listKey: string | null
  removed: boolean
  readonly parentPath: NodePath<P> | null
  readonly parent: P | null
  readonly container: P | Node[] | null

  readonly ctx: Context
  scope: Scope | undefined | null

  // accessKey = '';

  private constructor(data: NodePathData<T, P>) {
    this.node = data.node
    this.type = this.node && this.node.type
    this.key = data.key
    this.listKey = data.listKey
    this.parentPath = data.parentPath
    this.parent = this.parentPath && this.parentPath.node
    this.container = this.listKey
      ? (this.parent as any as Record<string, Node[]>)[this.listKey]
      : this.parent
    this.removed = false

    this.ctx = data.ctx
    this.scope = undefined

    // this.accessKey = (this.parentPath?.accessKey || '') + '.' + this.type;
  }

  /** Get the cached NodePath object or create new if cache is not available */
  static for<T extends Node = Node, P extends Node = Node>(data: NodePathData<T, P>): NodePath<T, P> {
    if (data.node == null) {
      // Don't cache a null NodePath
      return new this(data)
    }

    const { ctx: { pathCache }, parentPath } = data
    const children = pathCache.get(parentPath) || mapSet(pathCache, parentPath, new Map<Node, NodePath>())
    return (children.get(data.node) || mapSet(children, data.node, new NodePath<any, any>(data)))
  }

  init(parentScope?: Scope) {
    if (this.ctx.makeScope) {
      this.scope = Scope.for(this, parentScope || this.parentPath?.scope || null)
      if (this.scope != null) this.scope.init()
    }
    return this
  }

  protected throwNoParent(methodName: string): never {
    throw new Error(`Can not use \`${methodName}\` on a NodePath which does not have a parent`)
  }

  protected assertNotRemoved(): void {
    /* istanbul ignore next */
    if (this.removed) {
      throw new Error('Path is removed and it is now read-only')
    }
  }

  protected assertNotNull(methodName: string): void {
    /* istanbul ignore next */
    if (this.node == null) {
      throw new Error(`Can not use method \`${methodName}\` on a null NodePath`)
    }
  }

  get parentKey(): string | null {
    return this.listKey != null ? this.listKey : (this.key as string)
  }

  cloneNode(): T | null {
    return this.ctx.cloneFunction(this.node)
  }

  //#region Traversal

  skip() {
    this.ctx.setSkipped(this)
  }

  skipChildren() {
    this.assertNotNull('skipChildren')
    const node = this.node!
    const keys = visitorKeys[this.type!] || Object.keys(node)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const value = (node as any)[key]
      if (value == null) continue
      if (Array.isArray(value)) {
        this.get<Node[]>(key).forEach((p) => p.skip())
      } else if (typeof value.type === 'string') {
        this.get<Node>(key).skip()
      }
    }
  }

  unSkip() {
    this.assertNotRemoved()
    this.ctx.setNotSkipped(this)
    this.ctx.pushToQueue([this], 'unSkipped')
  }

  unskip() {
    this.unSkip()
  }

  unSkipChildren() {
    this.assertNotRemoved()
    this.assertNotNull('unSkipChildren')
    // We can use `pathCache` here because it has already been
    // built when `skipChildren` was used
    // And if `pathCache` has not been built that means
    // the children were not skipped in the first place
    this.ctx.pathCache.get(this)?.forEach((p) => p.unSkip())
  }

  unskipChildren() {
    this.unSkipChildren()
  }

  traverse<S>(visitors: Visitors<S>, state?: S) {
    this.assertNotNull('traverse')

    Traverser.traverseNode({
      node: this.node!,
      parentPath: this.parentPath,
      visitors,
      state,
      ctx: this.ctx,
      expand: true
    })
  }

  //#endregion

  //#region Ancestry

  findParent<N extends Node>(predicate: (path: NodePath<N>) => boolean): NodePath<N> | null {
    let parent: NodePath<any> | null = this.parentPath
    while (parent != null) {
      if (predicate(parent)) return parent
      parent = parent.parentPath
    }
    return null
  }

  find<N extends Node>(predicate: (path: NodePath<N>) => boolean): NodePath<N> | null {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let nodePath: NodePath<any> | null = this
    while (nodePath != null) {
      if (predicate(nodePath)) return nodePath
      nodePath = nodePath.parentPath
    }
    return null
  }

  getFunctionParent(): NodePath<t.Function> | null {
    return this.findParent((p) => is.function(p))
  }

  getAncestry(): NodePath[] {
    const ancestors = []
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let ancestor: NodePath | null = this
    while (ancestor != null) {
      ancestors.push(ancestor)
      ancestor = ancestor.parentPath
    }
    return ancestors
  }

  isAncestorOf(path: NodePath): boolean {
    return path.isDescendantOf(this)
  }

  isDescendantOf(path: NodePath): boolean {
    return this.findParent((p) => p === path) != null
  }

  //#endregion

  //#region Modification

  protected updateSiblingIndex(fromIndex: number, incrementBy: number): void {
    if ((this.container as any[]).length === 0) return

    this.ctx.pathCache.get(this.parentPath)?.forEach((path) => {
      if ((path.key as number) >= fromIndex) {
        (path.key as number) += incrementBy
      }
    })
  }

  insertBefore(nodes: readonly Node[]): NodePath<typeof nodes[number], P>[] {
    this.assertNotRemoved()

    // TODO: Handle more cases

    if (!Array.isArray(this.container)) {
      throw new Error('Can not insert before a node where `container` is not an Array')
    }

    const key = this.key as number

    for (let i = 0; i < nodes.length; i++) {
      runInsertionValidation(nodes[i], key + i, this.listKey, this.parent!)
    }

    this.container.splice(key, 0, ...nodes)
    this.updateSiblingIndex(key, nodes.length)

    const newPaths = nodes.map((node, idx) => (
      NodePath.for({
        node,
        key: key + idx,
        listKey: this.listKey,
        parentPath: this.parentPath,
        ctx: this.ctx
      }).init()
    ))

    this.ctx.pushToQueue(newPaths, 'new')

    return newPaths
  }

  insertAfter(nodes: readonly Node[]): NodePath<typeof nodes[number], P>[] {
    this.assertNotRemoved()

    // TODO: Handle more cases

    if (!Array.isArray(this.container)) {
      throw new Error('Can not insert after a node where `container` is not an Array')
    }

    const key = this.key as number

    for (let i = 0; i < nodes.length; i++) {
      runInsertionValidation(nodes[i], key + i + 1, this.listKey, this.parent!)
    }

    this.container.splice(key + 1, 0, ...nodes)
    this.updateSiblingIndex(key + 1, nodes.length)

    const newPaths = nodes.map((node, idx) => (
      NodePath.for({
        node,
        key: key + idx + 1,
        listKey: this.listKey,
        parentPath: this.parentPath,
        ctx: this.ctx
      }).init()
    ))

    this.ctx.pushToQueue(newPaths, 'new')

    return newPaths
  }

  unshiftContainer<K extends PickKeysWithValue<T, Node[]>>(
    listKey: K extends never ? string : K,
    nodes: Readonly<K extends never ? Node[] : T[K]>
  ): NodePath<
    K extends never
      ? Node
      : T[K] extends Node[] ? T[K][number] : Node,
    T
  >[]
  unshiftContainer(listKey: string, nodes: readonly Node[]): NodePath[] {
    this.assertNotRemoved()

    const firstNode = (this.node as any as Record<string, Node[]>)[listKey][0]
    // Create a virtual NodePath
    const lastNodePath = NodePath.for({
      node: firstNode,
      key: 0,
      listKey,
      parentPath: this,
      ctx: this.ctx
    })
    const newPaths = lastNodePath.insertBefore(nodes)

    return newPaths
  }

  pushContainer<K extends PickKeysWithValue<T, Node[]>>(
    listKey: K extends never ? string : K,
    nodes: Readonly<K extends never ? Node[] : T[K]>
  ): NodePath<
    K extends never
      ? Node
      : T[K] extends Node[] ? T[K][number] : Node,
    T
  >[]
  pushContainer(listKey: string, nodes: readonly Node[]): NodePath[] {
    this.assertNotRemoved()

    const container = (this.node as any as Record<string, Node[]>)[listKey]
    const lastNode = container[container.length - 1]
    // Create a virtual NodePath
    const lastNodePath = NodePath.for({
      node: lastNode,
      key: container.length - 1,
      listKey,
      parentPath: this,
      ctx: this.ctx
    })
    const newPaths = lastNodePath.insertAfter(nodes)

    return newPaths
  }

  //#endregion

  //#region Family
  
  get<K extends Keys<T>>(
    key: K
  ): T[K] extends (infer U | null)[]
    ? U extends Node ? NodePath<U, T>[] : NodePath<never, T>[]
    : T[K] extends Node ? NodePath<T[K], T> : NodePath<never, T>
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  get<N extends Node | Node[] | unknown = unknown>(
    key: string
  ): unknown extends N
    ? NodePath | NodePath[]
    : N extends Node[]
      ? NodePath<N[number]>[]
      : N extends Node ? NodePath<N> : NodePath<never>
  
  get(key: string): NodePath | NodePath[] {
    if (this.node == null) {
      throw new Error('Can not use method `get` on a null NodePath')
    }

    const value = (this.node as any as Record<string, Node | Node[] | null>)[key]

    if (Array.isArray(value)) {
      return value.map((node, index) => (
        NodePath.for({
          node,
          key: index,
          listKey: key,
          parentPath: this as any as NodePath,
          ctx: this.ctx
        }).init()
      )) as NodePath[]
    } else if (value != null && typeof value.type == 'string') {
      return NodePath.for({
        node: value as any as Node,
        key: key,
        listKey: null,
        parentPath: this as any as NodePath,
        ctx: this.ctx
      }).init() as NodePath
    }

    return NodePath.for({
      node: null,
      key: key,
      listKey: null,
      parentPath: this as any as NodePath,
      ctx: this.ctx
    }).init()
  }

  getSibling<N extends Node = Node>(key: string | number): NodePath<N> | undefined | never {
    if (this.parentPath == null) {
      this.throwNoParent('getSibling')
    }

    if (typeof key === 'string') {
      return this.parentPath.get(key) as NodePath<N>
    } else if (this.listKey != null) {
      return (this.parentPath.get(this.listKey) as NodePath[])[key] as NodePath<N>
    }
  }

  getOpposite() {
    switch (this.key) {
      case 'left': return this.getSibling('right')
      case 'right': return this.getSibling('left')
    }
  }

  getPrevSibling(): NodePath | undefined | never {
    return this.getSibling((this.key as number) - 1)
  }

  getNextSibling(): NodePath | undefined | never {
    return this.getSibling((this.key as number) + 1)
  }

  getAllPrevSiblings(): NodePath[] | undefined | never {
    if (this.parentPath == null) {
      this.throwNoParent('getAllPrevSiblings')
    }

    return this.parentPath
      .get<Node[]>(this.listKey as string)
      .slice(0, this.key as number)
      .reverse()
  }

  getAllNextSiblings(): NodePath[] | undefined | never {
    if (this.parentPath == null) {
      this.throwNoParent('getAllNextSiblings')
    }

    return this.parentPath
      .get<Node[]>(this.listKey as string)
      .slice((this.key as number) + 1)
  }

  //#endregion

  //#region Introspection

  has(key: Keys<T> extends never ? string : Keys<T>): boolean
  has(key: any): boolean {
    const value = (this.node as Record<string, any>)?.[key]
    if (value != null && Array.isArray(value) && value.length === 0) {
      return false
    }
    return !!value
  }

  is(key: Keys<T> extends never ? string : Keys<T>): boolean
  is(key: any): boolean {
    return !!(this.node as Record<string, any>)?.[key]
  }

  //#endregion

  //#region Removal

  private onRemove(): boolean {
    const { parent, key, listKey } = this
    const parentT = parent!.type
    const parentPath = this.parentPath!

    this.ctx.newSkipPathStack()

    switch (true) {
      case parentT === 'ExpressionStatement' && key === 'expression':
      case is.exportDeclaration(parent) && key === 'declaration':
      case (parentT === 'WhileStatement' || parentT === 'SwitchCase') && key === 'test':
      case parentT === 'LabeledStatement' && key === 'body':
      case (parentT === 'VariableDeclaration' && listKey === 'declarations' && (parent as NodeT<'VariableDeclaration'>).declarations.length === 1):
        parentPath.remove()
        return true

      case parentT === 'BinaryExpression':
        parentPath.replaceWith(
          (parent as NodeT<'BinaryExpression'>)[key === 'right' ? 'left' : 'right']
        )
        return true
      
      case parentT === 'IfStatement' && key === 'consequent':
      case (parentT === 'ArrowFunctionExpression' || is.loop(parent)) && key === 'body':
        if (parentT === 'ArrowFunctionExpression') {
          (parent as NodeT<'ArrowFunctionExpression'>).expression = false
        }
        this.replaceWith({
          type: 'BlockStatement',
          body: []
        })
        return true
    }

    this.ctx.restorePrevSkipPathStack()

    if (this.scope != null) Scope.handleRemoval(this.scope, this)

    return false
  }

  private markRemoved() {
    this.ctx.pathCache.get(this.parentPath)?.delete(this.node)
    this.removed = true
  }

  remove(): void {
    if (this.removed) {
      throw new Error('Node is already removed')
    }

    if (this.container == null) {
      this.throwNoParent('remove')
    }

    if (this.onRemove()) {
      // Things are handled by `onRemove` function.
      return this.markRemoved()
    }

    if (this.listKey != null) {
      const key = this.key as number
      const container = this.container as Node[]
      container.splice(key, 1)
      this.markRemoved()
      this.updateSiblingIndex(key + 1, -1)
    } else if (this.key != null) {
      (this.container as any as Record<string, Node | null>)[this.key] = null
      this.markRemoved()
    }
  }

  //#endregion

  //#region Replacement

  replaceWith<N extends Node = Node>(node: N): NodePath<N, P> {
    if (this.container == null) {
      this.throwNoParent('replaceWith')
    }
    if (this.removed) {
      throw new Error('Node is already removed')
    }

    runInsertionValidation(node, this.key!, this.listKey, this.parent!);

    (this.container as any as Record<string | number, Node>)[this.key!] = node
    this.markRemoved()

    const newPath = NodePath.for<N, P>({
      node,
      key: this.key,
      listKey: this.listKey,
      parentPath: this.parentPath,
      ctx: this.ctx
    }).init()

    this.ctx.pushToQueue([newPath], 'new')

    return newPath
  }

  replaceWithMultiple<N extends readonly Node[]>(nodes: N): NodePath<N[number]>[] {
    if (this.container == null) {
      this.throwNoParent('replaceWith')
    }
    if (this.removed) {
      throw new Error('Node is already removed')
    }

    const newPath = this.replaceWith(nodes[0])
    return [newPath].concat(newPath.insertAfter(nodes.slice(1)))
  }

  //#endregion
}
