import { Node, BaseNode } from 'estree';

export type BaseFieldData<
  KeyT = string,
  NodeT = Node,
  DefaultT = any
> = Readonly<{
  key: KeyT;
  validate?: (value: any) => void; // TODO: Make it required
  type?: string;
} & ({
  optional?: undefined;
} | {
  optional: true;
  default: DefaultT | ((node: NodeT) => DefaultT)
})>;

type FieldData<
  N extends Node,
  K extends keyof N = Exclude<keyof N, keyof BaseNode>
> = BaseFieldData<K, N, N[K]>;

type _Definitions = Readonly<{
  [K in Node as `${K['type']}`]: FieldData<K>[];
}>;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Definitions extends _Definitions { }

export const definitions: Definitions = {
  Identifier: [
    { key: 'name' }
  ],
  Literal: [
    { key: 'value' }
  ],
  Program: [
    { key: 'body' }
  ],
  FunctionDeclaration: [
    { key: 'id' },
    { key: 'params' },
    { key: 'body' },
    { key: 'generator', optional: true, default: false },
    { key: 'async', optional: true, default: false }
  ],
  FunctionExpression: [
    { key: 'id' },
    { key: 'params' },
    { key: 'body' },
    { key: 'generator', optional: true, default: false },
    { key: 'async', optional: true, default: false }
  ],
  ArrowFunctionExpression: [
    { key: 'params' },
    { key: 'body' },
    { key: 'expression', optional: true, default: false },
    { key: 'async', optional: true, default: false }
  ],
  SwitchCase: [
    { key: 'test' },
    { key: 'consequent' }
  ],
  CatchClause: [
    { key: 'param' },
    { key: 'body' }
  ],
  VariableDeclarator: [
    { key: 'id' },
    { key: 'init', optional: true, default: null }
  ],
  ExpressionStatement: [
    { key: 'expression' }
  ],
  BlockStatement: [
    { key: 'body' }
  ],
  EmptyStatement: [],
  DebuggerStatement: [],
  WithStatement: [
    { key: 'object' },
    { key: 'body' }
  ],
  ReturnStatement: [
    { key: 'argument', optional: true, default: null }
  ],
  LabeledStatement: [
    { key: 'label' },
    { key: 'body' }
  ],
  BreakStatement: [
    { key: 'label', optional: true, default: null }
  ],
  ContinueStatement: [
    { key: 'label', optional: true, default: null }
  ],
  IfStatement: [
    { key: 'test' },
    { key: 'consequent' },
    { key: 'alternate', optional: true, default: null }
  ],
  SwitchStatement: [
    { key: 'discriminant' },
    { key: 'cases' }
  ],
  ThrowStatement: [
    { key: 'argument' }
  ],
  TryStatement: [
    { key: 'block' },
    { key: 'handler' },
    { key: 'finalizer', optional: true, default: null }
  ],
  WhileStatement: [
    { key: 'test' },
    { key: 'body' }
  ],
  DoWhileStatement: [
    { key: 'test' },
    { key: 'body' }
  ],
  ForStatement: [
    { key: 'init' },
    { key: 'test' },
    { key: 'update' },
    { key: 'body' }
  ],
  ForInStatement: [
    { key: 'left' },
    { key: 'right' },
    { key: 'body' }
  ],
  ForOfStatement: [
    { key: 'left' },
    { key: 'right' },
    { key: 'body' }
  ],
  VariableDeclaration: [
    { key: 'kind' },
    { key: 'declarations' }
  ],
  ClassDeclaration: [
    { key: 'id' },
    { key: 'body' },
    { key: 'superClass', optional: true, default: null }
  ],
  ThisExpression: [],
  ArrayExpression: [
    { key: 'elements' }
  ],
  ObjectExpression: [
    { key: 'properties' }
  ],
  YieldExpression: [
    { key: 'argument' },
    { key: 'delegate', optional: true, default: false }
  ],
  UnaryExpression: [
    { key: 'operator' },
    { key: 'argument' },
    { key: 'prefix', optional: true, default: true }
  ],
  UpdateExpression: [
    { key: 'operator' },
    { key: 'argument' },
    { key: 'prefix' }
  ],
  BinaryExpression: [
    { key: 'operator' },
    { key: 'left' },
    { key: 'right' }
  ],
  AssignmentExpression: [
    { key: 'operator' },
    { key: 'left' },
    { key: 'right' }
  ],
  LogicalExpression: [
    { key: 'operator' },
    { key: 'left' },
    { key: 'right' }
  ],
  MemberExpression: [
    { key: 'object' },
    { key: 'property' },
    { key: 'computed', optional: true, default: false },
    { key: 'optional', optional: true, default: false }
  ],
  ConditionalExpression: [
    { key: 'test' },
    { key: 'consequent' },
    { key: 'alternate' }
  ],
  CallExpression: [
    { key: 'callee' },
    { key: 'arguments' },
    { key: 'optional', optional: true, default: false, type: 'boolean' }
  ],
  NewExpression: [
    { key: 'callee' },
    { key: 'arguments' }
  ],
  SequenceExpression: [
    { key: 'expressions' }
  ],
  TemplateLiteral: [
    { key: 'quasis' },
    { key: 'expressions' }
  ],
  TaggedTemplateExpression: [
    { key: 'tag' },
    { key: 'quasi' }
  ],
  ClassExpression: [
    { key: 'id' },
    { key: 'body' },
    { key: 'superClass', optional: true, default: null }
  ],
  MetaProperty: [
    { key: 'meta' },
    { key: 'property' }
  ],
  AwaitExpression: [
    { key: 'argument' }
  ],
  ImportExpression: [
    { key: 'source' }
  ],
  ChainExpression: [
    { key: 'expression' }
  ],
  Property: [
    { key: 'kind' },
    { key: 'key' },
    { key: 'value' },
    { key: 'computed', optional: true, default: false },
    { key: 'shorthand', optional: true, default: false }
  ],
  Super: [],
  TemplateElement: [
    { key: 'value' },
    { key: 'tail' }
  ],
  SpreadElement: [
    { key: 'argument' }
  ],
  ObjectPattern: [
    { key: 'properties' }
  ],
  ArrayPattern: [
    { key: 'elements' }
  ],
  RestElement: [
    { key: 'argument' }
  ],
  AssignmentPattern: [
    { key: 'left' },
    { key: 'right' }
  ],
  ClassBody: [
    { key: 'body' }
  ],
  MethodDefinition: [
    { key: 'kind' },
    { key: 'key' },
    { key: 'value' },
    { key: 'computed', optional: true, default: false },
    { key: 'static', optional: true, default: false }
  ],
  ImportDeclaration: [
    { key: 'specifiers' },
    { key: 'source' }
  ],
  ExportNamedDeclaration: [
    { key: 'declaration' },
    { key: 'specifiers', optional: true, default: [] },
    { key: 'source', optional: true, default: null }
  ],
  ExportDefaultDeclaration: [
    { key: 'declaration' }
  ],
  ExportAllDeclaration: [
    { key: 'source' }
  ],
  ImportSpecifier: [
    { key: 'imported' },
    { key: 'local', optional: true, default: (node) => node.imported }
  ],
  ImportDefaultSpecifier: [
    { key: 'local' }
  ],
  ImportNamespaceSpecifier: [
    { key: 'local' }
  ],
  ExportSpecifier: [
    { key: 'local' },
    { key: 'exported', optional: true, default: (node) => node.local }
  ]
};