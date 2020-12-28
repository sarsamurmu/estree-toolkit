import { Node, Pattern } from 'estree';

import { NodePath } from './nodepath';
import { Traverser, Visitor } from './traverse';
import { NodeMap, NodeT } from './utils';
import { Binding, BindingKind, BindingPathT, GlobalBinding } from './binding';

const assertNever = (x: never) => x;

type ParentsOf<N extends keyof NodeMap> = {
  [K in keyof NodeMap]: NodeMap[N] extends NodeMap[K][keyof NodeMap[K]] ? NodeMap[K] : never;
}[keyof NodeMap];
type KeyInParent<N extends keyof NodeMap, P extends keyof NodeMap> = Exclude<{
  [K in keyof NodeMap[P]]: NodeMap[N] extends NodeMap[P][K] ? K : never;
}[keyof NodeMap[P]], undefined>;

type IdentifierParent = ParentsOf<'Identifier'>;
type IdentifierKeyInParent<P extends keyof NodeMap> = KeyInParent<'Identifier', P>;

type CrawlerState = {
  references: NodePath<NodeT<'Identifier'>>[];
  constantViolations: NodePath<NodeT<'Identifier'>>[];
  labelReferences: NodePath<NodeT<'Identifier'>>[];
  scope: Scope;
  childScopedPaths: NodePath<NodeT<ScopedNode>>[];
}

const ParentCrawlFn: {
  [K in IdentifierParent['type']]: (
    key: IdentifierKeyInParent<K>,
    path: NodePath<NodeT<'Identifier'>, NodeT<K>>,
    state: CrawlerState
  ) => void;
} = {
  ArrowFunctionExpression(key, path, state) {
    switch (key) {
      case 'body':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  AssignmentExpression(key, path, state) {
    switch (key) {
      case 'left':
        state.constantViolations.push(path);
        break;
      case 'right':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  AssignmentPattern(key, path, state) {
    switch (key) {
      case 'left':
        // TODO
        // ? IDK what to do
        // Appears in
        // - const { a = 0 } = x;
        // - function fn(a = 0) {}
        // - ...
        //
        // `a = 0` is AssignmentPattern
        // I don't think this would ever get called
        throw new Error('`ParentCrawlFn.AssignmentPattern` is unimplemented');
      case 'right':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  AwaitExpression(key, path, state) {
    switch (key) {
      case 'argument':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  FunctionDeclaration(key) {
    switch (key) {
      case 'id':
        throw new Error('This should be handled by `scopePathCrawlers.FunctionDeclaration`');
      default: assertNever(key);
    }
  },
  FunctionExpression(key) {
    switch (key) {
      case 'id':
        throw new Error('This should be handled by `scopePathCrawlers.FunctionExpression`');
      default: assertNever(key);
    }
  },
  SwitchCase(key, path, state) {
    switch (key) {
      case 'test':
        state.references.push(path);
        break;
      default: assertNever(key)
    }
  },
  CatchClause(key) {
    switch (key) {
      case 'param':
        throw new Error('This should be handled by `scopePathCrawlers.CatchClause`');
      default: assertNever(key);
    }
  },
  VariableDeclarator(key, path, state) {
    switch (key) {
      case 'id': {
        // Declare
        break;
      }
      case 'init':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  ExpressionStatement(key, path, state) {
    switch (key) {
      case 'expression':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  WithStatement(key, path, state) {
    switch (key) {
      case 'object':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  ReturnStatement(key, path, state) {
    switch (key) {
      case 'argument':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  LabeledStatement(key, path, state) {
    switch (key) {
      case 'label': {
        state.scope.registerLabel(path);
        break;
      }
      default: assertNever(key);
    }
  },
  BreakStatement(key, path, state) {
    switch (key) {
      case 'label': {
        state.labelReferences.push(path);
        break;
      }
      default: assertNever(key);
    }
  },
  ContinueStatement(key, path, state) {
    switch (key) {
      case 'label': {
        state.labelReferences.push(path);
        break;
      }
      default: assertNever(key);
    }
  },
  IfStatement(key, path, state) {
    switch (key) {
      case 'test':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  SwitchStatement(key, path, state) {
    switch (key) {
      case 'discriminant':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  ThrowStatement(key, path, state) {
    switch (key) {
      case 'argument':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  WhileStatement(key, path, state) {
    switch (key) {
      case 'test':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  DoWhileStatement(key, path, state) {
    switch (key) {
      case 'test':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  ForStatement(key, path, state) {
    switch (key) {
      case 'init':
      case 'test':
      case 'update':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  ForInStatement(key, path, state) {
    switch (key) {
      case 'left':
        state.constantViolations.push(path);
        break;
      case 'right':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  ForOfStatement(key, path, state) {
    switch (key) {
      case 'left':
        state.constantViolations.push(path);
        break;
      case 'right':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  ClassDeclaration(key, path, state) {
    switch (key) {
      case 'id':
        throw new Error('This should be handled by `scopePathCrawlers.ClassDeclaration`');
      case 'superClass':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  YieldExpression(key, path, state) {
    switch (key) {
      case 'argument':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  UnaryExpression(key, path, state) {
    switch (key) {
      case 'argument':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  UpdateExpression(key, path, state) {
    switch (key) {
      case 'argument':
        state.constantViolations.push(path);
        break;
      default: assertNever(key);
    }
  },
  BinaryExpression(key, path, state) {
    switch (key) {
      case 'left':
      case 'right':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  LogicalExpression(key, path, state) {
    switch (key) {
      case 'left':
      case 'right':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  MemberExpression(key, path, state) {
    switch (key) {
      case 'object':
        state.references.push(path);
        break;
      case 'property': break;
      default: assertNever(key);
    }
  },
  ConditionalExpression(key, path, state) {
    switch (key) {
      case 'test':
      case 'consequent':
      case 'alternate':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  CallExpression(key, path, state) {
    switch (key) {
      case 'callee':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  NewExpression(key, path, state) {
    switch (key) {
      case 'callee':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  TaggedTemplateExpression(key, path, state) {
    switch (key) {
      case 'tag':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  ClassExpression(key, path, state) {
    switch (key) {
      case 'id':
        throw new Error('This should be handled by `scopePathCrawlers.ClassExpression`');
      case 'superClass':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  MetaProperty(key) {
    switch (key) {
      case 'meta':
      case 'property': break;
      default: assertNever(key);
    }
  },
  ImportExpression(key, path, state) {
    switch (key) {
      case 'source':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  Property(key, path, state) {
    switch (key) {
      case 'key': {
        if ((path.parent as NodeT<'Property'>).computed) {
          state.references.push(path);
        }
        break;
      }
      case 'value':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  SpreadElement(key, path, state) {
    switch (key) {
      case 'argument':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  RestElement(key, path, state) {
    switch (key) {
      case 'argument':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  MethodDefinition(key) {
    switch (key) {
      case 'key': break;
      default: assertNever(key);
    }
  },
  ExportDefaultDeclaration(key, path, state) {
    switch (key) {
      case 'declaration':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  ImportSpecifier(key, path, state) {
    switch (key) {
      case 'imported':
        if (path.parent!.local == null) {
          state.scope.registerBinding('module', path, path.parentPath!);
        }
        break;
      case 'local':
        state.scope.registerBinding('module', path, path.parentPath!);
        break;
      default: assertNever(key);
    }
  },
  ImportDefaultSpecifier(key, path, state) {
    switch (key) {
      case 'local':
        state.scope.registerBinding('module', path, path.parentPath!);
        break;
      default: assertNever(key);
    }
  },
  ImportNamespaceSpecifier(key, path, state) {
    switch (key) {
      case 'local':
        state.scope.registerBinding('module', path, path.parentPath!);
        break;
      default: assertNever(key);
    }
  },
  ExportSpecifier(key, path, state) {
    switch (key) {
      case 'local':
        state.references.push(path);
        break;
      case 'exported': break;
      default: assertNever(key);
    }
  }
}

const scopedNodeTypes = [
  'ArrowFunctionExpression',
  'BlockStatement',
  'CatchClause',
  'ClassDeclaration',
  'ClassExpression',
  'DoWhileStatement',
  'ForInStatement',
  'ForOfStatement',
  'ForStatement',
  'FunctionDeclaration',
  'FunctionExpression',
  'Program',
  'SwitchStatement',
  'WhileStatement'
] as const;
type ScopedNode = typeof scopedNodeTypes[number];

// From -
//  const { a, b: [c, { d }], e: f, ...g } = x;
// Returns paths to
// - a, c, d, f, g
const findDeclaringPathsInPattern = (
  path: NodePath<Pattern>,
  result: NodePath[]
) => {
  switch (path.node!.type) {
    case 'Identifier':
      result.push(path);
      // Already crawled, skip it
      path.skip();
      break;

    case 'ObjectPattern': {
      const properties = (path as NodePath<NodeT<'ObjectPattern'>>).get('properties');
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        const propertyNode = property.node!;

        switch (propertyNode.type) {
          case 'RestElement':
            findDeclaringPathsInPattern(property as NodePath<NodeT<'RestElement'>>, result);
            break;

          case 'Property':
            if (propertyNode.value != null) {
              findDeclaringPathsInPattern(
                (property as NodePath<NodeT<'Property'>>).get('value') as NodePath<Pattern>,
                result
              );
            } else if (
              !propertyNode.computed &&
              propertyNode.key.type === 'Identifier'
            ) {
              result.push(path);
              // Already crawled, skip it
              path.skip();
            }
            break;
        }
      }
      break;
    }

    case 'ArrayPattern': {
      const elementPaths = (path as NodePath<NodeT<'ArrayPattern'>>).get('elements');
      for (let i = 0; i < elementPaths.length; i++) {
        findDeclaringPathsInPattern(elementPaths[i], result);
      }
      break;
    }

    case 'RestElement':
      findDeclaringPathsInPattern((path as NodePath<NodeT<'RestElement'>>).get('argument'), result);
      break;

    case 'AssignmentPattern':
      findDeclaringPathsInPattern((path as NodePath<NodeT<'AssignmentPattern'>>).get('left'), result);
      break;

    case 'MemberExpression': break;

    default: assertNever(path.node!.type);
  }
}

const registerVariableDeclaration = (path: NodePath<NodeT<'VariableDeclaration'>>, scope: Scope) => {
  const kind = path.node!.kind;
  const declarators = path.get('declarations');
  for (let i = 0; i < declarators.length; i++) {
    const identifierPaths: NodePath<NodeT<'Identifier'>>[] = [];
    findDeclaringPathsInPattern(declarators[i].get('init'), identifierPaths);
    for (let j = 0; j < identifierPaths.length; i++) {
      scope.registerBinding(kind, identifierPaths[j], declarators[i]);
    }
  }
}

const crawlerVisitor: {
  Identifier: Visitor<NodeT<'Identifier'>, CrawlerState>;
  VariableDeclaration: Visitor<NodeT<'VariableDeclaration'>, CrawlerState>;
} = {
  Identifier(path, state) {
    const parentType = path.parentPath!.node?.type as IdentifierParent['type'];
    const crawlFn = ParentCrawlFn[parentType] || (() => 0);

    crawlFn(
      path.key as never,
      path as NodePath<NodeT<'Identifier'>, any>,
      state
    );
  },
  VariableDeclaration(path, state) {
    registerVariableDeclaration(path, state.scope);
  }
};

for (let i = 0; i < scopedNodeTypes.length; i++) {
  type VisitorType = Visitor<NodeMap[ScopedNode], CrawlerState>;
  (crawlerVisitor as Record<string, VisitorType>)[scopedNodeTypes[i]] = (path, state) => {
    // Stop crawling whenever a scoped node is found
    // children will handle the further crawling
    state.childScopedPaths.push(path);
    path.skip();
  }
}

const registerParam = (path: NodePath<Pattern>, scope: Scope, kind: BindingKind = 'param') => {
  const identifierPaths: NodePath<NodeT<'Identifier'>>[] = [];
  findDeclaringPathsInPattern(path, identifierPaths);
  for (let i = 0; i < identifierPaths.length; i++) {
    scope.registerBinding(kind, identifierPaths[i], path as NodePath<any>);
  }
}

const registerParams = (paths: NodePath<Pattern>[], scope: Scope) => {
  for (let i = 0; i < paths.length; i++) {
    registerParam(paths[i], scope);
  }
}

const scopePathCrawlers: {
  [K in ScopedNode]: null | ((path: NodePath<NodeT<K>>, scope: Scope) => void);
} = {
  Program: null,
  FunctionDeclaration(path, scope) {
    // ? Register `unknown` binding if `id` is null
    if (path.node!.id != null) {
      const id = path.get('id');
      // `crawlerVisitor` stops whenever it founds `FunctionDeclaration`
      // so it never gets the chance to register the function declaration
      // Register it to the parent
      scope.parent!.registerBinding('hoisted', id, path);
      // Skip it as we have already gathered information from it
      id.skip();
    }
    registerParams(path.get('params'), scope);
  },
  ClassDeclaration(path, scope) {
    // ? Register `unknown` binding if `id` is null
    if (path.node!.id != null) {
      const id = path.get('id');
      // See `FunctionDeclaration`s comments
      scope.parent!.registerBinding('hoisted', id, path);
      id.skip();
    }
  },
  FunctionExpression(path, scope) {
    if (path.node!.id != null) {
      const id = path.get('id');
      scope.registerBinding('local', id, path);
      id.skip();
    }
    registerParams(path.get('params'), scope);
  },
  ClassExpression(path, scope) {
    if (path.node!.id != null) {
      const id = path.get('id');
      scope.registerBinding('local', id, path);
      id.skip();
    }
  },
  ArrowFunctionExpression(path, scope) {
    registerParams(path.get('params'), scope);
  },
  CatchClause(path, scope) {
    registerParam(path.get('param'), scope, 'let');
  },
  BlockStatement: null,
  SwitchStatement: null,
  WhileStatement: null,
  DoWhileStatement: null,
  ForStatement(path, scope) {
    if (path.node!.init != null && path.node!.init.type === 'VariableDeclaration') {
      registerVariableDeclaration(path.get('init'), scope);
    }
  },
  ForInStatement(path, scope) {
    if (path.node!.left.type === 'VariableDeclaration') {
      registerVariableDeclaration(path.get('left') as NodePath<NodeT<'VariableDeclaration'>>, scope);
    }
  },
  ForOfStatement(path, scope) {
    if (path.node!.left.type === 'VariableDeclaration') {
      registerVariableDeclaration(path.get('left') as NodePath<NodeT<'VariableDeclaration'>>, scope);
    }
  },
}

const scopedNodesTypesSet = new Set<Node['type']>(scopedNodeTypes);

const shouldMakeScope = (path: NodePath): boolean => {
  if (path.node == null) return false;

  // Don't create scope if `BlockStatement` is placed in these places
  // - for (let x in f) {}    -- ForInStatement -> BlockStatement
  // - () => {}               -- ArrowFunctionExpression -> BlockStatement
  // - function () {}         -- FunctionExpression -> BlockStatement
  // - while (x) {}           -- WhileStatement -> BlockStatement
  // - ...
  // But not in these cases
  // - { let x; { let x; } }  -- BlockStatement -> BlockStatement
  // - { }                    -- Program -> BlockStatement

  if (
    path.node.type === 'BlockStatement' &&
    path.parent != null &&
    path.parent.type !== 'BlockStatement' &&
    path.parent.type !== 'Program' &&
    scopedNodesTypesSet.has(path.parent.type)
  ) {
    return false;
  }

  return scopedNodesTypesSet.has(path.node.type);
}

export class Scope {
  readonly path: NodePath<NodeT<ScopedNode>>;
  readonly parent: Scope | null;
  readonly children: Scope[] = [];
  private initialized = false;
  bindings: Record<string, Binding | undefined> = {};
  globalBindings: Record<string, GlobalBinding | undefined> = {};

  private constructor(path: NodePath, parentScope: Scope | null) {
    this.path = path as NodePath<NodeT<ScopedNode>>;
    this.parent = parentScope;
    if (this.parent != null) this.parent.children.push(this);
  }

  static for(path: NodePath, parentScope: Scope | null): Scope | null {
    if (shouldMakeScope(path)) {
      if (path.ctx.scopeCache.has(path)) {
        return path.ctx.scopeCache.get(path)!;
      }

      const scope = new Scope(path, parentScope);
      path.ctx.scopeCache.set(path, scope);
      return scope;
    }

    return parentScope;
  }

  init(): void {
    if (this.initialized) return;
    this.crawl();
  }

  crawl(): void {
    if (this.path.node == null) return;

    this.bindings = {};
    this.globalBindings = {};

    const state: CrawlerState = {
      references: [],
      constantViolations: [],
      labelReferences: [],
      scope: this,
      childScopedPaths: []
    }

    // Disable making scope for children or it will cause an infinite loop
    this.path.ctx.makeScope = false;
    // Create a new skip path stack so that it won't affect the user's skip path stack
    this.path.ctx.newSkipPathStack();

    {
      const scopePathCrawler = scopePathCrawlers[this.path.node!.type];
      if (scopePathCrawler != null) scopePathCrawler(this.path as NodePath<any>, this);
    }

    Traverser.traverseNode({
      node: this.path.node,
      parentPath: this.path.parentPath,
      ctx: this.path.ctx,
      state,
      visitors: crawlerVisitor,
      onlyChildren: true
    });

    this.path.ctx.makeScope = true;
    this.path.ctx.restorePrevSkipPathStack();

    for (let i = 0; i < state.references.length; i++) {
      const path = state.references[i];
      const binding = this.getBinding(path.node!.name);
      if (binding) {
        binding.addReference(path);
      } else {
        this
          .getGlobalBinding(path.node!.name, true)
          .addReference(path);
      }
    }

    for (let i = 0; i < state.constantViolations.length; i++) {
      const path = state.constantViolations[i];
      const binding = this.getBinding(path.node!.name);
      if (binding) {
        binding.addConstantViolation(path);
      } else {
        this
          .getGlobalBinding(path.node!.name, true)
          .addConstantViolation(path);
      }
    }

    for (let i = 0; i < state.labelReferences.length; i++) {
      // TODO: Reference labels
    }

    this.initialized = true;

    for (let i = 0; i < state.childScopedPaths.length; i++) {
      state.childScopedPaths[i].init();
    }
  }

  registerBinding<T extends BindingKind>(
    kind: T,
    identifierPath: NodePath<NodeT<'Identifier'>>,
    bindingPath: BindingPathT<T>
  ): void;
  registerBinding(
    kind: string,
    identifierPath: NodePath<NodeT<'Identifier'>>,
    bindingPath: NodePath<any>
  ) {
    const bindingName = identifierPath.node!.name;

    this.bindings[bindingName] = new Binding({
      kind: kind as Binding['kind'],
      name: bindingName,
      scope: this,
      identifierPath,
      path: bindingPath
    });
  }

  hasOwnBinding(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.bindings, name);
  }

  getOwnBinding(name: string): Binding | undefined {
    return this.bindings[name];
  }

  getBinding(name: string): Binding | undefined {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let scope: Scope | null = this;
    while (scope != null) {
      if (scope.hasOwnBinding(name)) {
        return scope.getOwnBinding(name);
      }
      scope = scope.parent;
    }
  }

  getProgramScope(): Scope {
    if (this.path.type === 'Program') {
      return this;
    } else {
      return this.path.findParent((p) => p.type === 'Program')!.scope!;
    }
  }

  hasGlobalBinding(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.globalBindings, name);
  }

  getGlobalBinding<C extends boolean>(name: string, create?: C): true extends C ? GlobalBinding : GlobalBinding | undefined {
    const programScope = this.getProgramScope();
    let globalBinding = programScope.globalBindings[name];
    if (create === true && globalBinding == null) {
      globalBinding = programScope.globalBindings[name] = new GlobalBinding({ name });
    }
    return globalBinding as any;
  }

  registerLabel(path: NodePath<NodeT<'Identifier'>>) {
    // TODO: Implement method
  }
}
