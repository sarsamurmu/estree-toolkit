import fs from 'fs'
import path from 'path'

import { Node } from '../src/helpers'
import { definitions } from '../src/definitions'

const nodeTypesMap: {
    [K in Node['type']]: 0
} = {
    CatchClause: 0,
    ClassBody: 0,
    Identifier: 0,
    Literal: 0,
    MethodDefinition: 0,
    PrivateIdentifier: 0,
    Program: 0,
    Property: 0,
    PropertyDefinition: 0,
    SpreadElement: 0,
    Super: 0,
    SwitchCase: 0,
    TemplateElement: 0,
    VariableDeclarator: 0,
    JSXIdentifier: 0,
    JSXNamespacedName: 0,
    JSXMemberExpression: 0,
    JSXEmptyExpression: 0,
    JSXExpressionContainer: 0,
    JSXSpreadAttribute: 0,
    JSXAttribute: 0,
    JSXOpeningElement: 0,
    JSXOpeningFragment: 0,
    JSXClosingElement: 0,
    JSXClosingFragment: 0,
    JSXElement: 0,
    JSXFragment: 0,
    JSXText: 0,
    ArrayExpression: 0,
    ArrowFunctionExpression: 0,
    AssignmentExpression: 0,
    AwaitExpression: 0,
    BinaryExpression: 0,
    CallExpression: 0,
    ChainExpression: 0,
    ClassExpression: 0,
    ConditionalExpression: 0,
    FunctionExpression: 0,
    ImportExpression: 0,
    LogicalExpression: 0,
    MemberExpression: 0,
    MetaProperty: 0,
    NewExpression: 0,
    ObjectExpression: 0,
    SequenceExpression: 0,
    TaggedTemplateExpression: 0,
    TemplateLiteral: 0,
    ThisExpression: 0,
    UnaryExpression: 0,
    UpdateExpression: 0,
    YieldExpression: 0,
    ClassDeclaration: 0,
    FunctionDeclaration: 0,
    ImportDeclaration: 0,
    ExportNamedDeclaration: 0,
    ExportDefaultDeclaration: 0,
    ExportAllDeclaration: 0,
    ImportSpecifier: 0,
    ImportDefaultSpecifier: 0,
    ImportNamespaceSpecifier: 0,
    ExportSpecifier: 0,
    ObjectPattern: 0,
    ArrayPattern: 0,
    RestElement: 0,
    AssignmentPattern: 0,
    ExpressionStatement: 0,
    BlockStatement: 0,
    StaticBlock: 0,
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
    JSXSpreadChild: 0,
    ImportAttribute: 0
}
const nodeTypes = new Set(Object.keys(nodeTypesMap))
const definitionKeys = new Set(Object.keys(definitions))
const missing: string[] = []

nodeTypes.forEach((nodeType) => {
    if (!definitionKeys.has(nodeType)) {
        missing.push(nodeType)
    }
})

if (missing.length) {
    throw new Error(`Following nodes are missing their definition: ${missing.join(', ')}`);
}
