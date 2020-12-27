import { Node } from 'estree';

import { NodePath } from './nodepath';
import { is } from './is';
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
  scopePath: NodePath;
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
        // Check parent to find out
        break;
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
  FunctionDeclaration(key, path, state) {
    switch (key) {
      case 'id':
        state.scope.registerBinding('hoisted', path, path.parentPath!);
        break;
      default: assertNever(key);
    }
  },
  FunctionExpression(key, path, state) {
    switch (key) {
      case 'id':
        state.scope.registerBinding('local', path, path.parentPath!);
        break;
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
  CatchClause(key, path, state) {
    switch (key) {
      case 'param':
        state.scope.registerBinding('let', path, path);
        break;
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
        // Create new label
        break;
      }
      default: assertNever(key);
    }
  },
  BreakStatement(key, path, state) {
    switch (key) {
      case 'label': {
        // Reference label
        break;
      }
      default: assertNever(key);
    }
  },
  ContinueStatement(key, path, state) {
    switch (key) {
      case 'label': {
        // Reference label
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
        // Declare
        break;
      case 'test':
      case 'update':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  ForInStatement(key, path, state) {
    switch (key) {
      case 'left': {
        // Reference or maybe Assignment?
        break;
      }
      case 'right':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  ForOfStatement(key, path, state) {
    switch (key) {
      case 'left': {
        // Reference or maybe Assignment?
        break;
      }
      case 'right':
        state.references.push(path);
        break;
      default: assertNever(key);
    }
  },
  ClassDeclaration(key, path, state) {
    switch (key) {
      case 'id': {
        // Declare
        break;
      }
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
      case 'id': {
        // Declare
        break;
      }
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
        // TODO: Needs research
        // Declare
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

const defaultCrawlFn: Visitor<NodeMap[ScopedNode], CrawlerState> = (path, state) => {
  state.childScopedPaths.push(path);
  path.skip();
}

const crawlerVisitor = Object.assign<
  { Identifier: Visitor<NodeT<'Identifier'>, CrawlerState> },
  { [K in ScopedNode]: Visitor<NodeT<K>, CrawlerState> }
>({
  Identifier: (path, state) => {
    const parentType = path.parentPath!.node?.type as IdentifierParent['type'];
    const crawlFn = ParentCrawlFn[parentType] || (() => 0);

    crawlFn(
      path.key as never,
      path as NodePath<NodeT<'Identifier'>, any>,
      state
    );
  },
}, {
  ArrowFunctionExpression: defaultCrawlFn,
  FunctionDeclaration: defaultCrawlFn,
  FunctionExpression: defaultCrawlFn,
  ClassDeclaration: defaultCrawlFn,
  ClassExpression: defaultCrawlFn,
  CatchClause: defaultCrawlFn,

  BlockStatement: defaultCrawlFn,
  DoWhileStatement: defaultCrawlFn,
  ForInStatement: defaultCrawlFn,
  ForOfStatement: defaultCrawlFn,
  ForStatement: defaultCrawlFn,
  Program: defaultCrawlFn,
  SwitchStatement: defaultCrawlFn,
  WhileStatement: defaultCrawlFn,
});

const scopedNodesTypesSet = new Set<Node['type']>(scopedNodeTypes);
const isScope = (node: Node | null, parent?: Node | null): boolean => {
  if (node == null) return false;

  // Taken from https://github.com/babel/babel/blob/0d558964838c266f4a8817d499e0fcd364af962c/packages/babel-types/src/validators/isScope.ts#L13
  if (
    node.type === 'BlockStatement' &&
    parent != null &&
    (parent.type === 'CatchClause' || is.function(parent))
  ) {
    return false;
  }

  if (
    is.pattern(node) &&
    parent != null &&
    (parent.type === 'CatchClause' || is.function(parent))
  ) {
    return true;
  }
  
  return scopedNodesTypesSet.has(node.type);
}

export class Scope {
  readonly path: NodePath;
  readonly parent: Scope | null;
  private initialized = false;
  bindings: Record<string, Binding | undefined> = {};
  globalBindings: Record<string, GlobalBinding | undefined> = {};

  private constructor(path: NodePath, parentScope: Scope | null) {
    this.path = path;
    this.parent = parentScope;
  }

  static for(path: NodePath, parentScope: Scope | null): Scope | null {
    if (!isScope(path.node, path.parentPath?.node)) return parentScope;

    if (path.ctx.scopeCache.has(path)) {
      return path.ctx.scopeCache.get(path)!;
    }

    const scope = new Scope(path, parentScope);
    path.ctx.scopeCache.set(path, scope);
    return scope;
  }

  init(): void {
    if (this.initialized) return;
    this.crawl();
    this.initialized = true;
  }

  crawl(): void {
    if (this.path.node == null) return;

    const state: CrawlerState = {
      references: [],
      constantViolations: [],
      scope: this,
      scopePath: this.path,
      childScopedPaths: []
    }

    this.bindings = {};
    this.globalBindings = {};

    // Disable making scope for children or it will cause an infinite loop
    this.path.ctx.makeScope = false;
    // Create a new skip path stack so that it won't interfere with the user's visitors
    this.path.ctx.newSkipPathStack();

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

    // TODO: Run child scoped paths
    for (let i = 0; i < state.childScopedPaths.length; i++) {
      state.childScopedPaths[i].init();
    }
  }

  registerBinding<T extends BindingKind>(
    kind: T,
    path: NodePath<NodeT<'Identifier'>>,
    bindingPath: BindingPathT<T>
  ): void;
  registerBinding(
    kind: string,
    path: NodePath<NodeT<'Identifier'>>,
    bindingPath: NodePath<any>
  ) {
    const bindingName = path.node!.name;

    this.bindings[bindingName] = new Binding({
      kind: kind as Binding['kind'],
      name: bindingName,
      scope: this,
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
}
