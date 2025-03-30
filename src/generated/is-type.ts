// Generated file. Do not modify by hands.
// Run "npm run generate" to re-generate this file.

import { Node, BaseNode } from '../helpers';
import { Identifier, Literal, Program, FunctionDeclaration, FunctionExpression, ArrowFunctionExpression, SwitchCase, CatchClause, VariableDeclarator, ExpressionStatement, BlockStatement, EmptyStatement, DebuggerStatement, WithStatement, ReturnStatement, LabeledStatement, BreakStatement, ContinueStatement, IfStatement, SwitchStatement, ThrowStatement, TryStatement, WhileStatement, DoWhileStatement, ForStatement, ForInStatement, ForOfStatement, VariableDeclaration, ClassDeclaration, ThisExpression, ArrayExpression, ObjectExpression, YieldExpression, UnaryExpression, UpdateExpression, BinaryExpression, AssignmentExpression, LogicalExpression, MemberExpression, ConditionalExpression, CallExpression, NewExpression, SequenceExpression, TemplateLiteral, TaggedTemplateExpression, ClassExpression, MetaProperty, AwaitExpression, ImportExpression, ChainExpression, Property, Super, TemplateElement, SpreadElement, ObjectPattern, ArrayPattern, RestElement, AssignmentPattern, ClassBody, MethodDefinition, ImportDeclaration, ExportNamedDeclaration, ExportDefaultDeclaration, ExportAllDeclaration, ImportSpecifier, ImportDefaultSpecifier, ImportNamespaceSpecifier, ExportSpecifier, PrivateIdentifier, PropertyDefinition, StaticBlock, ImportAttribute, JSXIdentifier, JSXNamespacedName, JSXMemberExpression, JSXEmptyExpression, JSXExpressionContainer, JSXSpreadAttribute, JSXAttribute, JSXClosingElement, JSXClosingFragment, JSXElement, JSXFragment, JSXOpeningElement, JSXOpeningFragment, JSXSpreadChild, JSXText } from 'estree-jsx';
import { NodePath } from '../nodepath';
import type { AliasMap } from '../aliases';

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
  privateIdentifier: Checker<PrivateIdentifier>;
  propertyDefinition: Checker<PropertyDefinition>;
  staticBlock: Checker<StaticBlock>;
  importAttribute: Checker<ImportAttribute>;
  jsxIdentifier: Checker<JSXIdentifier>;
  jsxNamespacedName: Checker<JSXNamespacedName>;
  jsxMemberExpression: Checker<JSXMemberExpression>;
  jsxEmptyExpression: Checker<JSXEmptyExpression>;
  jsxExpressionContainer: Checker<JSXExpressionContainer>;
  jsxSpreadAttribute: Checker<JSXSpreadAttribute>;
  jsxAttribute: Checker<JSXAttribute>;
  jsxClosingElement: Checker<JSXClosingElement>;
  jsxClosingFragment: Checker<JSXClosingFragment>;
  jsxElement: Checker<JSXElement>;
  jsxFragment: Checker<JSXFragment>;
  jsxOpeningElement: Checker<JSXOpeningElement>;
  jsxOpeningFragment: Checker<JSXOpeningFragment>;
  jsxSpreadChild: Checker<JSXSpreadChild>;
  jsxText: Checker<JSXText>;

  function: Checker<AliasMap['Function']>;
  statement: Checker<AliasMap['Statement']>;
  declaration: Checker<AliasMap['Declaration']>;
  expression: Checker<AliasMap['Expression']>;
  pattern: Checker<AliasMap['Pattern']>;
  class: Checker<AliasMap['Class']>;
  exportDeclaration: Checker<AliasMap['ExportDeclaration']>;
  loop: Checker<AliasMap['Loop']>;
  moduleDeclaration: Checker<AliasMap['ModuleDeclaration']>;
}