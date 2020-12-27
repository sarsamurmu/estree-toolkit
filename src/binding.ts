import { NodePath } from './nodepath';
import { Scope } from './scope';
import { NodeT } from './utils';

class BaseBinding {
  readonly references: NodePath<NodeT<'Identifier'>>[] = [];
  readonly constantViolations: NodePath<NodeT<'Identifier'>>[] = [];

  addReference(path: NodePath<NodeT<'Identifier'>>) {
    this.references.push(path);
  }

  addConstantViolation(path: NodePath<NodeT<'Identifier'>>) {
    this.constantViolations.push(path);
  }
}

export type BindingKind = 'var' | 'let' | 'param' | 'unknown' | 'hoisted' | 'local' | 'module';
export type BindingPathT<T extends BindingKind> = (
  {
    hoisted: NodePath<NodeT<'FunctionDeclaration' | 'ClassDeclaration'>>;
    local: NodePath<NodeT<'FunctionExpression' | 'ClassExpression'>>;
    module: NodePath<NodeT<'ImportSpecifier' | 'ImportDefaultSpecifier' | 'ImportNamespaceSpecifier'>>;
  } & {
    [_ in 'var' | 'let' | 'param' | 'unknown']: NodePath<NodeT<'Identifier'>>;
  }
)[T];

export class Binding<T extends BindingKind = BindingKind> extends BaseBinding {
  readonly kind: BindingKind;
  readonly name: string;
  readonly scope: Scope;
  readonly path: BindingPathT<T>;

  constructor(data: {
    kind: Binding['kind'],
    name: string;
    scope: Scope;
    path: BindingPathT<T>;
  }) {
    super();
    this.kind = data.kind;
    this.name = data.name;
    this.scope = data.scope;
    this.path = data.path;
  }
}

export class GlobalBinding extends BaseBinding {
  readonly kind = 'global';
  readonly name: string;

  constructor(data: {
    name: string;
  }) {
    super();
    this.name = data.name;
  }
}
