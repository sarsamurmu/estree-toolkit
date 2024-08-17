import * as ESTree from 'estree-jsx'

/** Creates a clean object that doesn't have any prototype */
const clean = <T>(obj: T): T => Object.assign(Object.create(null), obj) as T

export type AliasMap = {
  Function: ESTree.Function;
  Statement: ESTree.Statement;
  Declaration: ESTree.Declaration;
  Expression: ESTree.Expression;
  Pattern: ESTree.Pattern;
  Class: ESTree.Class;
  ExportDeclaration: ESTree.ExportAllDeclaration | ESTree.ExportDefaultDeclaration | ESTree.ExportNamedDeclaration;
  Loop:
  | ESTree.ForStatement
  | ESTree.ForInStatement
  | ESTree.ForOfStatement
  | ESTree.WhileStatement
  | ESTree.DoWhileStatement;
  ModuleDeclaration: ESTree.ModuleDeclaration;
}

export const aliases: {
  [K in keyof AliasMap]: {
    [X in AliasMap[K]['type']]: 0;
  }
} = clean({
  Function: clean({
    FunctionDeclaration: 0,
    FunctionExpression: 0,
    ArrowFunctionExpression: 0
  }),
  Statement: clean({
    FunctionDeclaration: 0,
    ExpressionStatement: 0,
    BlockStatement: 0,
    EmptyStatement: 0,
    DebuggerStatement: 0,
    WithStatement: 0,
    ReturnStatement: 0,
    LabeledStatement: 0,
    BreakStatement: 0,
    ContinueStatement: 0,
    IfStatement: 0,
    SwitchStatement: 0,
    ThrowStatement: 0,
    TryStatement: 0,
    WhileStatement: 0,
    DoWhileStatement: 0,
    ForStatement: 0,
    ForInStatement: 0,
    ForOfStatement: 0,
    VariableDeclaration: 0,
    ClassDeclaration: 0,
    StaticBlock: 0
  }),
  Declaration: clean({
    FunctionDeclaration: 0,
    VariableDeclaration: 0,
    ClassDeclaration: 0
  }),
  Expression: clean({
    FunctionExpression: 0,
    ArrowFunctionExpression: 0,
    ClassExpression: 0,
    CallExpression: 0,
    ConditionalExpression: 0,
    ChainExpression: 0,
    Identifier: 0,
    Literal: 0,
    ThisExpression: 0,
    ArrayExpression: 0,
    ObjectExpression: 0,
    YieldExpression: 0,
    UnaryExpression: 0,
    UpdateExpression: 0,
    BinaryExpression: 0,
    AssignmentExpression: 0,
    LogicalExpression: 0,
    MemberExpression: 0,
    NewExpression: 0,
    SequenceExpression: 0,
    TemplateLiteral: 0,
    TaggedTemplateExpression: 0,
    MetaProperty: 0,
    AwaitExpression: 0,
    ImportExpression: 0,
    JSXElement: 0,
    JSXFragment: 0
  }),
  Pattern: clean({
    Identifier: 0,
    MemberExpression: 0,
    ObjectPattern: 0,
    ArrayPattern: 0,
    RestElement: 0,
    AssignmentPattern: 0
  }),
  Class: clean({
    ClassDeclaration: 0,
    ClassExpression: 0
  }),
  ExportDeclaration: clean({
    ExportNamedDeclaration: 0,
    ExportDefaultDeclaration: 0,
    ExportAllDeclaration: 0
  }),
  Loop: clean({
    ForStatement: 0,
    ForInStatement: 0,
    ForOfStatement: 0,
    WhileStatement: 0,
    DoWhileStatement: 0,
  }),
  ModuleDeclaration: clean({
    ExportAllDeclaration: 0,
    ExportDefaultDeclaration: 0,
    ExportNamedDeclaration: 0,
    ImportDeclaration: 0,
  })
})
