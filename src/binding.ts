import {
  CatchClause,
  ClassDeclaration,
  ClassExpression,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier,
  JSXIdentifier,
  Pattern,
  VariableDeclarator
} from 'estree-jsx'

import { NodePath } from './nodepath'
import { Scope } from './scope'

class BaseBinding {
  readonly references: NodePath<Identifier | JSXIdentifier>[] = []
  readonly constantViolations: NodePath<Identifier>[] = []

  addReference(path: NodePath<Identifier | JSXIdentifier>) {
    this.references.push(path)
  }
  
  // Splice is performance intensive, I guess it wouldn't matter for small
  // arrays, anyway someone's hardly gonna use this remove* methods
  removeReference(path: NodePath<Identifier | JSXIdentifier>) {
    const idx = this.references.findIndex((x) => x === path)
    if (idx > -1) this.references.splice(idx, 1)
  }

  addConstantViolation(path: NodePath<Identifier>) {
    this.constantViolations.push(path)
  }

  removeConstantViolation(path: NodePath<Identifier>) {
    const idx = this.constantViolations.findIndex((x) => x === path)
    if (idx > -1) this.constantViolations.splice(idx, 1)
  }
}

export type BindingKind = 'var' | 'let' | 'const' | 'param' | 'unknown' | 'hoisted' | 'local' | 'module'
export type BindingPathT<T extends BindingKind> = (
  {
    hoisted: NodePath<FunctionDeclaration | ClassDeclaration>;
    local: NodePath<FunctionExpression | ClassExpression>;
    module: NodePath<ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier>;
    let: NodePath<VariableDeclarator> | NodePath<CatchClause>;
    param: NodePath<Pattern>;
    unknown: NodePath<FunctionDeclaration | ClassDeclaration>;
  } & {
    [_ in 'var' | 'const']: NodePath<VariableDeclarator>;
  }
)[T]

export class Binding<T extends BindingKind = BindingKind> extends BaseBinding {
  readonly kind: BindingKind
  readonly name: string
  readonly scope: Scope
  readonly identifierPath: NodePath<Identifier>
  readonly path: BindingPathT<T>

  constructor(data: {
    kind: Binding['kind'],
    name: string;
    scope: Scope;
    identifierPath: Binding['identifierPath'];
    path: BindingPathT<T>;
  }) {
    super()
    this.kind = data.kind
    this.name = data.name
    this.scope = data.scope
    this.identifierPath = data.identifierPath
    this.path = data.path
  }

  get constant() {
    return this.constantViolations.length === 0
  }
}

export class GlobalBinding extends BaseBinding {
  readonly kind = 'global'
  readonly constant = false
  readonly name: string

  constructor(data: {
    name: string;
  }) {
    super()
    this.name = data.name
  }
}
