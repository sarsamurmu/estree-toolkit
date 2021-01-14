// Generated file. Do not modify by hands.
// Run "npm run generate" to re-generate this file.

import { Node, BaseNode, Identifier, Literal, Program, FunctionDeclaration, FunctionExpression, ArrowFunctionExpression, SwitchCase, CatchClause, VariableDeclarator, ExpressionStatement, BlockStatement, EmptyStatement, DebuggerStatement, WithStatement, ReturnStatement, LabeledStatement, BreakStatement, ContinueStatement, IfStatement, SwitchStatement, ThrowStatement, TryStatement, WhileStatement, DoWhileStatement, ForStatement, ForInStatement, ForOfStatement, VariableDeclaration, ClassDeclaration, ThisExpression, ArrayExpression, ObjectExpression, YieldExpression, UnaryExpression, UpdateExpression, BinaryExpression, AssignmentExpression, LogicalExpression, MemberExpression, ConditionalExpression, CallExpression, NewExpression, SequenceExpression, TemplateLiteral, TaggedTemplateExpression, ClassExpression, MetaProperty, AwaitExpression, ImportExpression, ChainExpression, Property, Super, TemplateElement, SpreadElement, ObjectPattern, ArrayPattern, RestElement, AssignmentPattern, ClassBody, MethodDefinition, ImportDeclaration, ExportNamedDeclaration, ExportDefaultDeclaration, ExportAllDeclaration, ImportSpecifier, ImportDefaultSpecifier, ImportNamespaceSpecifier, ExportSpecifier } from 'estree';
import { NodePath } from '../nodepath';

export type Matcher<T extends Node> = {
  [K in Exclude<keyof T, keyof BaseNode>]?: T[K] | ((value: T[K]) => boolean);
}

export type Checker<T extends Node> = {
  (node: Node | undefined | null, toMatch?: Matcher<T>): node is T;
  (path: NodePath | undefined | null, toMatch?: Matcher<T>): path is NodePath<T>;
}

export type Is = {
  identifier: Checker<Identifier>;
  literal: Checker<Literal>;
  program: Checker<Program>;
  functionDeclaration: Checker<FunctionDeclaration>;
  functionExpression: Checker<FunctionExpression>;
  arrowFunctionExpression: Checker<ArrowFunctionExpression>;
  switchCase: Checker<SwitchCase>;
  catchClause: Checker<CatchClause>;
  variableDeclarator: Checker<VariableDeclarator>;
  expressionStatement: Checker<ExpressionStatement>;
  blockStatement: Checker<BlockStatement>;
  emptyStatement: Checker<EmptyStatement>;
  debuggerStatement: Checker<DebuggerStatement>;
  withStatement: Checker<WithStatement>;
  returnStatement: Checker<ReturnStatement>;
  labeledStatement: Checker<LabeledStatement>;
  breakStatement: Checker<BreakStatement>;
  continueStatement: Checker<ContinueStatement>;
  ifStatement: Checker<IfStatement>;
  switchStatement: Checker<SwitchStatement>;
  throwStatement: Checker<ThrowStatement>;
  tryStatement: Checker<TryStatement>;
  whileStatement: Checker<WhileStatement>;
  doWhileStatement: Checker<DoWhileStatement>;
  forStatement: Checker<ForStatement>;
  forInStatement: Checker<ForInStatement>;
  forOfStatement: Checker<ForOfStatement>;
  variableDeclaration: Checker<VariableDeclaration>;
  classDeclaration: Checker<ClassDeclaration>;
  thisExpression: Checker<ThisExpression>;
  arrayExpression: Checker<ArrayExpression>;
  objectExpression: Checker<ObjectExpression>;
  yieldExpression: Checker<YieldExpression>;
  unaryExpression: Checker<UnaryExpression>;
  updateExpression: Checker<UpdateExpression>;
  binaryExpression: Checker<BinaryExpression>;
  assignmentExpression: Checker<AssignmentExpression>;
  logicalExpression: Checker<LogicalExpression>;
  memberExpression: Checker<MemberExpression>;
  conditionalExpression: Checker<ConditionalExpression>;
  callExpression: Checker<CallExpression>;
  newExpression: Checker<NewExpression>;
  sequenceExpression: Checker<SequenceExpression>;
  templateLiteral: Checker<TemplateLiteral>;
  taggedTemplateExpression: Checker<TaggedTemplateExpression>;
  classExpression: Checker<ClassExpression>;
  metaProperty: Checker<MetaProperty>;
  awaitExpression: Checker<AwaitExpression>;
  importExpression: Checker<ImportExpression>;
  chainExpression: Checker<ChainExpression>;
  property: Checker<Property>;
  super: Checker<Super>;
  templateElement: Checker<TemplateElement>;
  spreadElement: Checker<SpreadElement>;
  objectPattern: Checker<ObjectPattern>;
  arrayPattern: Checker<ArrayPattern>;
  restElement: Checker<RestElement>;
  assignmentPattern: Checker<AssignmentPattern>;
  classBody: Checker<ClassBody>;
  methodDefinition: Checker<MethodDefinition>;
  importDeclaration: Checker<ImportDeclaration>;
  exportNamedDeclaration: Checker<ExportNamedDeclaration>;
  exportDefaultDeclaration: Checker<ExportDefaultDeclaration>;
  exportAllDeclaration: Checker<ExportAllDeclaration>;
  importSpecifier: Checker<ImportSpecifier>;
  importDefaultSpecifier: Checker<ImportDefaultSpecifier>;
  importNamespaceSpecifier: Checker<ImportNamespaceSpecifier>;
  exportSpecifier: Checker<ExportSpecifier>;

  function: Checker<import('../definitions').AliasMap['Function']>;
  statement: Checker<import('../definitions').AliasMap['Statement']>;
  declaration: Checker<import('../definitions').AliasMap['Declaration']>;
  expression: Checker<import('../definitions').AliasMap['Expression']>;
  pattern: Checker<import('../definitions').AliasMap['Pattern']>;
  class: Checker<import('../definitions').AliasMap['Class']>;
  exportDeclaration: Checker<import('../definitions').AliasMap['ExportDeclaration']>;
}