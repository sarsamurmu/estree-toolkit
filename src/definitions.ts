import { BaseNode, Node, ParentsOf } from './helpers'
import * as a from './assert'

type NodeKeys<N> = Exclude<keyof N, keyof BaseNode>

export type DefinitionIndex<T> = T extends true
  ? number | [builderIndex: number | false, visitIndex: number | false]
  : false | [builderIndex: number | false, visitIndex: false]

export type DefinitionField<N, V> = {
  default?: V | ((node: N) => V);
  validate: a.ValidateFn<Exclude<V, undefined | RegExp>>;
  // Some node types include RegExp, but in practical it never appears
  type?: string;
}

export type Definition<N extends Node = Node> = {
  indices: {
    [K in NodeKeys<N>]: DefinitionIndex<N[K] extends Node | (Node | null)[] | undefined | null ? true : false>;
  };
  fields: {
    [F in NodeKeys<N>]: DefinitionField<N, N[F]>;
  };
  finalValidate?: a.ValidateFn<N>;
  insertionValidate?: (node: N, key: string | number, listKey: string | null, parent: ParentsOf<N>) => string | null;
}

export type Definitions = {
  [N in Node as `${N['type']}`]: Definition<N>;
}

const anyValidate = {
  validate: a.any
}

export const definitions: Definitions = Object.assign<any, Definitions>(Object.create(null), {
  Identifier: {
    indices: {
      name: [0, false]
    },
    fields: {
      name: {
        validate: a.chain(
          a.value('string'),
          a.validIdentifier(false)
        )
      }
    },
    insertionValidate(node, key, listKey, parent) {
      if (
        (parent.type === 'MemberExpression' && !parent.computed && key === 'property') ||
        ((parent.type === 'Property' || parent.type === 'MethodDefinition') && !parent.computed && key === 'key') ||
        (parent.type === 'ExportSpecifier' && key === 'exported') ||
        (parent.type === 'ImportSpecifier' && key === 'imported') ||
        (parent.type === 'MetaProperty' && (key === 'meta' && node.name === 'import' || key === 'property' && node.name === 'meta'))
      ) {
        return null
      }

      if (a.isReserved(node.name)) {
        return `${JSON.stringify(node.name)} is not a valid identifier.`
      }

      return null
    }
  },
  Literal: {
    indices: {
      value: [0, false],
      raw: false
    },
    fields: {
      value: {
        // ts-expect-error Practically RegExp would never appear here
        validate: a.value('string', 'number', 'bigint', 'boolean', 'null')
      },
      raw: anyValidate
    }
  },
  Program: {
    indices: {
      body: 0,
      sourceType: [1, false],
      comments: [2, false]
    },
    fields: {
      body: {
        validate: a.arrayOf(a.OR(a.nodeAlias('Statement'), a.nodeAlias('ModuleDeclaration')))
      },
      sourceType: {
        default: 'module',
        validate: a.value('string')
      },
      comments: { default: [], ...anyValidate }
    }
  },
  FunctionDeclaration: {
    indices: {
      id: 0,
      params: 1,
      body: 2,
      generator: [3, false],
      async: [4, false]
    },
    fields: {
      id: {
        validate: a.nullable(a.node('Identifier'))
      },
      params: {
        validate: a.arrayOf(a.nodeAlias('Pattern'))
      },
      body: {
        validate: a.node('BlockStatement')
      },
      generator: {
        default: false,
        validate: a.value('boolean')
      },
      async: {
        default: false,
        validate: a.value('boolean')
      }
    }
  },
  FunctionExpression: {
    indices: {
      id: 0,
      params: 1,
      body: 2,
      generator: [3, false],
      async: [4, false]
    },
    fields: {
      id: {
        validate: a.nullable(a.node('Identifier'))
      },
      params: {
        validate: a.arrayOf(a.nodeAlias('Pattern'))
      },
      body: {
        validate: a.node('BlockStatement')
      },
      generator: {
        default: false,
        validate: a.value('boolean')
      },
      async: {
        default: false,
        validate: a.value('boolean')
      }
    }
  },
  ArrowFunctionExpression: {
    indices: {
      params: 0,
      body: 1,
      expression: [2, false],
      async: [3, false],
      generator: false
    },
    fields: {
      params: {
        validate: a.arrayOf(a.nodeAlias('Pattern'))
      },
      body: {
        validate: a.OR(a.node('BlockStatement'), a.nodeAlias('Expression'))
      },
      expression: {
        default: false,
        validate: a.value('boolean')
      },
      async: {
        default: false,
        validate: a.value('boolean')
      },
      generator: anyValidate
    }
  },
  SwitchCase: {
    indices: {
      test: 0,
      consequent: 1
    },
    fields: {
      test: {
        validate: a.nullable(a.nodeAlias('Expression'))
      },
      consequent: {
        validate: a.arrayOf(a.nodeAlias('Statement'))
      }
    }
  },
  CatchClause: {
    indices: {
      param: 0,
      body: 1
    },
    fields: {
      param: {
        validate: a.nullable(a.nodeAlias('Pattern'))
      },
      body: {
        validate: a.node('BlockStatement')
      }
    }
  },
  VariableDeclarator: {
    indices: {
      id: 0,
      init: 1
    },
    fields: {
      id: {
        validate: a.nodeAlias('Pattern')
      },
      init: {
        default: null,
        validate: a.nullable(a.nodeAlias('Expression'))
      }
    }
  },
  ExpressionStatement: {
    indices: {
      expression: 0
    },
    fields: {
      expression: {
        validate: a.nodeAlias('Expression')
      }
    }
  },
  BlockStatement: {
    indices: {
      body: 0,
      innerComments: false
    },
    fields: {
      body: {
        validate: a.arrayOf(a.nodeAlias('Statement'))
      },
      innerComments: anyValidate
    }
  },
  EmptyStatement: {
    indices: {},
    fields: {}
  },
  DebuggerStatement: {
    indices: {},
    fields: {}
  },
  WithStatement: {
    indices: {
      object: 0,
      body: 1
    },
    fields: {
      object: {
        validate: a.nodeAlias('Expression')
      },
      body: {
        validate: a.nodeAlias('Statement')
      }
    }
  },
  ReturnStatement: {
    indices: {
      argument: 0
    },
    fields: {
      argument: {
        default: null,
        validate: a.nullable(a.nodeAlias('Expression'))
      }
    }
  },
  LabeledStatement: {
    indices: {
      label: 0,
      body: 1
    },
    fields: {
      label: {
        validate: a.node('Identifier')
      },
      body: {
        validate: a.nodeAlias('Statement')
      }
    }
  },
  BreakStatement: {
    indices: {
      label: 0
    },
    fields: {
      label: {
        default: null,
        validate: a.nullable(a.node('Identifier'))
      }
    }
  },
  ContinueStatement: {
    indices: {
      label: 0
    },
    fields: {
      label: {
        default: null,
        validate: a.nullable(a.node('Identifier'))
      }
    }
  },
  IfStatement: {
    indices: {
      test: 0,
      consequent: 1,
      alternate: 2
    },
    fields: {
      test: {
        validate: a.nodeAlias('Expression')
      },
      consequent: {
        validate: a.nodeAlias('Statement')
      },
      alternate: {
        default: null,
        validate: a.nullable(a.nodeAlias('Statement'))
      }
    }
  },
  SwitchStatement: {
    indices: {
      discriminant: 0,
      cases: 1
    },
    fields: {
      discriminant: {
        validate: a.nodeAlias('Expression')
      },
      cases: {
        validate: a.arrayOf(a.node('SwitchCase'))
      }
    }
  },
  ThrowStatement: {
    indices: {
      argument: 0
    },
    fields: {
      argument: {
        validate: a.nodeAlias('Expression')
      }
    }
  },
  TryStatement: {
    indices: {
      block: 0,
      handler: 1,
      finalizer: 2
    },
    fields: {
      block: {
        validate: a.node('BlockStatement')
      },
      handler: {
        validate: a.nullable(a.node('CatchClause'))
      },
      finalizer: {
        default: null,
        validate: a.nullable(a.node('BlockStatement'))
      }
    },
    finalValidate(node) {
      if (node.handler == null && node.finalizer == null) {
        return 'If `handler` is null then `finalizer` must be not null'
      }
      return null
    }
  },
  WhileStatement: {
    indices: {
      test: 0,
      body: 1
    },
    fields: {
      test: {
        validate: a.nodeAlias('Expression')
      },
      body: {
        validate: a.nodeAlias('Statement')
      }
    }
  },
  DoWhileStatement: {
    indices: {
      test: 0,
      body: 1
    },
    fields: {
      test: {
        validate: a.nodeAlias('Expression')
      },
      body: {
        validate: a.nodeAlias('Statement')
      }
    }
  },
  ForStatement: {
    indices: {
      init: 0,
      test: 1,
      update: 2,
      body: 3
    },
    fields: {
      init: {
        validate: a.nullable(a.OR(a.node('VariableDeclaration'), a.nodeAlias('Expression')))
      },
      test: {
        validate: a.nullable(a.nodeAlias('Expression'))
      },
      update: {
        validate: a.nullable(a.nodeAlias('Expression'))
      },
      body: {
        validate: a.nodeAlias('Statement')
      }
    }
  },
  ForInStatement: {
    indices: {
      left: 0,
      right: 1,
      body: 2
    },
    fields: {
      left: {
        validate: a.OR(a.node('VariableDeclaration'), a.nodeAlias('Pattern'))
      },
      right: {
        validate: a.nodeAlias('Expression')
      },
      body: {
        validate: a.nodeAlias('Statement')
      }
    }
  },
  ForOfStatement: {
    indices: {
      left: 0,
      right: 1,
      body: 2,
      await: [3, false]
    },
    fields: {
      left: {
        validate: a.OR(a.node('VariableDeclaration'), a.nodeAlias('Pattern'))
      },
      right: {
        validate: a.nodeAlias('Expression')
      },
      body: {
        validate: a.nodeAlias('Statement')
      },
      await: {
        validate: a.value('boolean')
      }
    }
  },
  VariableDeclaration: {
    indices: {
      kind: [0, false],
      declarations: 1
    },
    fields: {
      kind: {
        validate: a.oneOf(['var', 'let', 'const'] as const)
      },
      declarations: {
        validate: a.arrayOf(a.node('VariableDeclarator'))
      }
    }
  },
  ClassDeclaration: {
    indices: {
      id: 0,
      body: 2,
      superClass: [3, 1]
    },
    fields: {
      id: {
        validate: a.nullable(a.node('Identifier'))
      },
      body: {
        validate: a.node('ClassBody')
      },
      superClass: {
        default: null,
        validate: a.nullable(a.nodeAlias('Expression'))
      }
    }
  },
  ThisExpression: {
    indices: {},
    fields: {}
  },
  ArrayExpression: {
    indices: {
      elements: 0
    },
    fields: {
      elements: {
        validate: a.arrayOf(a.nullable(a.OR(a.nodeAlias('Expression'), a.node('SpreadElement'))))
      }
    }
  },
  ObjectExpression: {
    indices: {
      properties: 0
    },
    fields: {
      properties: {
        validate: a.arrayOf(a.node('Property', 'SpreadElement'))
      }
    }
  },
  YieldExpression: {
    indices: {
      argument: 0,
      delegate: [1, false]
    },
    fields: {
      argument: {
        validate: a.nullable(a.nodeAlias('Expression'))
      },
      delegate: {
        default: false,
        validate: a.value('boolean')
      }
    }
  },
  UnaryExpression: {
    indices: {
      operator: [0, false],
      argument: 1,
      prefix: [2, false]
    },
    fields: {
      operator: {
        validate: a.oneOf(['-', '+', '!', '~', 'typeof', 'void', 'delete'] as const)
      },
      argument: {
        validate: a.nodeAlias('Expression')
      },
      prefix: {
        default: true,
        validate: a.value('boolean')
      }
    }
  },
  UpdateExpression: {
    indices: {
      operator: [0, false],
      argument: 1,
      prefix: [2, false]
    },
    fields: {
      operator: {
        validate: a.oneOf(['++', '--'] as const)
      },
      argument: {
        validate: a.nodeAlias('Expression')
      },
      prefix: {
        validate: a.value('boolean')
      }
    }
  },
  BinaryExpression: {
    indices: {
      operator: [0, false],
      left: 1,
      right: 2
    },
    fields: {
      operator: {
        validate: a.oneOf([
          '==', '!=', '===', '!==', '<', '<=', '>', '>=', '<<', '>>', '>>>',
          '+', '-', '*', '/', '%', '**', '|', '^', '&', 'in', 'instanceof'
        ] as const)
      },
      left: {
        validate: a.OR(a.nodeAlias('Expression'), a.node('PrivateIdentifier'))
      },
      right: {
        validate: a.nodeAlias('Expression')
      }
    }
  },
  AssignmentExpression: {
    indices: {
      operator: [0, false],
      left: 1,
      right: 2
    },
    fields: {
      operator: {
        validate: a.oneOf([
          '=', '+=', '-=', '*=', '/=', '%=', '**=', '<<=', '>>=', '>>>=',
          '|=', '^=', '&=', '||=', '&&=', '??=',
        ] as const)
      },
      left: {
        validate: a.nodeAlias('Pattern')
      },
      right: {
        validate: a.nodeAlias('Expression')
      }
    }
  },
  LogicalExpression: {
    indices: {
      operator: [0, false],
      left: 1,
      right: 2
    },
    fields: {
      operator: {
        validate: a.oneOf(['||', '&&', '??'] as const)
      },
      left: {
        validate: a.nodeAlias('Expression')
      },
      right: {
        validate: a.nodeAlias('Expression')
      }
    }
  },
  MemberExpression: {
    indices: {
      object: 0,
      property: 1,
      computed: [2, false],
      optional: [3, false]
    },
    fields: {
      object: {
        validate: a.OR(a.nodeAlias('Expression'), a.node('Super'))
      },
      property: {
        validate: a.OR(a.nodeAlias('Expression'), a.node('PrivateIdentifier'))
      },
      computed: {
        default: false,
        validate: a.value('boolean')
      },
      optional: {
        default: false,
        validate: a.value('boolean')
      }
    }
  },
  ConditionalExpression: {
    indices: {
      test: 0,
      consequent: 1,
      alternate: 2
    },
    fields: {
      test: {
        validate: a.nodeAlias('Expression')
      },
      consequent: {
        validate: a.nodeAlias('Expression')
      },
      alternate: {
        validate: a.nodeAlias('Expression')
      }
    }
  },
  CallExpression: {
    indices: {
      callee: 0,
      arguments: 1,
      optional: [2, false]
    },
    fields: {
      callee: {
        validate: a.OR(a.nodeAlias('Expression'), a.node('Super'))
      },
      arguments: {
        validate: a.arrayOf(a.OR(a.nodeAlias('Expression'), a.node('SpreadElement')))
      },
      optional: {
        type: 'boolean',
        default: false,
        validate: a.value('boolean')
      }
    }
  },
  NewExpression: {
    indices: {
      callee: 0,
      arguments: 1
    },
    fields: {
      callee: {
        validate: a.OR(a.nodeAlias('Expression'), a.node('Super'))
      },
      arguments: {
        validate: a.arrayOf(a.OR(a.nodeAlias('Expression'), a.node('SpreadElement')))
      }
    }
  },
  SequenceExpression: {
    indices: {
      expressions: 0
    },
    fields: {
      expressions: {
        validate: a.arrayOf(a.nodeAlias('Expression'))
      }
    }
  },
  TemplateLiteral: {
    indices: {
      quasis: 0,
      expressions: 1
    },
    fields: {
      quasis: {
        validate: a.arrayOf(a.node('TemplateElement'))
      },
      expressions: {
        validate: a.arrayOf(a.nodeAlias('Expression'))
      }
    }
  },
  TaggedTemplateExpression: {
    indices: {
      tag: 0,
      quasi: 1
    },
    fields: {
      tag: {
        validate: a.nodeAlias('Expression')
      },
      quasi: {
        validate: a.node('TemplateLiteral')
      }
    }
  },
  ClassExpression: {
    indices: {
      id: 0,
      body: 2,
      superClass: [3, 1]
    },
    fields: {
      id: {
        validate: a.nullable(a.node('Identifier'))
      },
      body: {
        validate: a.node('ClassBody')
      },
      superClass: {
        default: null,
        validate: a.nullable(a.nodeAlias('Expression'))
      }
    }
  },
  MetaProperty: {
    indices: {
      meta: 0,
      property: 1
    },
    fields: {
      meta: {
        validate: a.node('Identifier')
      },
      property: {
        validate: a.node('Identifier')
      }
    }
  },
  AwaitExpression: {
    indices: {
      argument: 0
    },
    fields: {
      argument: {
        validate: a.nodeAlias('Expression')
      }
    }
  },
  ImportExpression: {
    indices: {
      source: 0
    },
    fields: {
      source: {
        validate: a.nodeAlias('Expression')
      }
    }
  },
  ChainExpression: {
    indices: {
      expression: 0
    },
    fields: {
      expression: {
        validate: a.node('CallExpression', 'MemberExpression')
      }
    }
  },
  Property: {
    indices: {
      kind: [0, false],
      key: 1,
      value: 2,
      computed: [3, false],
      shorthand: [4, false],
      method: false
    },
    fields: {
      kind: {
        validate: a.oneOf(['init', 'get', 'set'] as const)
      },
      key: {
        validate: a.OR(a.nodeAlias('Expression'), a.node('PrivateIdentifier'))
      },
      value: {
        validate: a.OR(a.nodeAlias('Expression'), a.nodeAlias('Pattern'), a.node('Property'))
      },
      computed: {
        default: false,
        validate: a.value('boolean')
      },
      shorthand: {
        default: false,
        validate: a.value('boolean')
      },
      method: {
        validate: a.value('boolean')
      }
    }
  },
  Super: {
    indices: {},
    fields: {}
  },
  TemplateElement: {
    indices: {
      value: [0, false],
      tail: [1, false]
    },
    fields: {
      value: {
        validate: a.nonNull
      },
      tail: {
        validate: a.value('boolean')
      }
    }
  },
  SpreadElement: {
    indices: {
      argument: 0
    },
    fields: {
      argument: {
        validate: a.nodeAlias('Expression')
      }
    }
  },
  ObjectPattern: {
    indices: {
      properties: 0
    },
    fields: {
      properties: {
        validate: a.arrayOf(a.node('Property', 'RestElement'))
      }
    }
  },
  ArrayPattern: {
    indices: {
      elements: 0
    },
    fields: {
      elements: {
        validate: a.arrayOf(a.nullable(a.nodeAlias('Pattern')))
      }
    }
  },
  RestElement: {
    indices: {
      argument: 0
    },
    fields: {
      argument: {
        validate: a.nodeAlias('Pattern')
      }
    },
    insertionValidate(node, key, listKey, parent) {
      if (((parent as unknown as Record<string, unknown[]>)[listKey as string]).length > (key as number)) {
        return `RestElement should be the last children of "${listKey}"`
      }

      return null
    }
  },
  AssignmentPattern: {
    indices: {
      left: 0,
      right: 1
    },
    fields: {
      left: {
        validate: a.nodeAlias('Pattern')
      },
      right: {
        validate: a.nodeAlias('Expression')
      }
    }
  },
  ClassBody: {
    indices: {
      body: 0
    },
    fields: {
      body: {
        validate: a.arrayOf(a.node('StaticBlock', 'PropertyDefinition', 'MethodDefinition'))
      }
    }
  },
  MethodDefinition: {
    indices: {
      kind: [0, false],
      key: 1,
      value: 2,
      computed: [3, false],
      static: [4, false]
    },
    fields: {
      kind: {
        validate: a.oneOf(['method', 'get', 'set', 'constructor'] as const)
      },
      key: {
        validate: a.OR(a.nodeAlias('Expression'), a.node('PrivateIdentifier'))
      },
      value: {
        validate: a.node('FunctionExpression')
      },
      computed: {
        default: false,
        validate: a.value('boolean')
      },
      static: {
        default: false,
        validate: a.value('boolean')
      }
    }
  },
  ImportDeclaration: {
    indices: {
      specifiers: 0,
      source: 1
    },
    fields: {
      specifiers: {
        validate: a.arrayOf(a.node('ImportSpecifier', 'ImportDefaultSpecifier', 'ImportNamespaceSpecifier'))
      },
      source: {
        validate: a.node('Literal')
      }
    }
  },
  ExportNamedDeclaration: {
    indices: {
      declaration: 0,
      specifiers: 1,
      source: 2
    },
    fields: {
      declaration: {
        validate: a.nullable(a.nodeAlias('Declaration'))
      },
      specifiers: {
        default: [],
        validate: a.arrayOf(a.node('ExportSpecifier'))
      },
      source: {
        default: null,
        validate: a.nullable(a.node('Literal'))
      }
    }
  },
  ExportDefaultDeclaration: {
    indices: {
      // @ts-expect-error the `estree` package made types more complex
      declaration: 0
    },
    fields: {
      declaration: {
        // @ts-expect-error the `estree` package made types more complex
        validate: a.OR(a.nodeAlias('Declaration'), a.nodeAlias('Expression'))
      }
    }
  },
  ExportAllDeclaration: {
    indices: {
      source: 0,
      exported: 1
    },
    fields: {
      source: {
        validate: a.node('Literal')
      },
      exported: {
        default: null,
        validate: a.nullable(a.OR(a.node('Identifier'), a.node('Literal')))
      }
    }
  },
  ImportSpecifier: {
    indices: {
      imported: 0,
      local: 1
    },
    fields: {
      imported: {
        validate: a.OR(a.node('Identifier'), a.node('Literal'))
      },
      local: {
        default: (node) => {
          if (node.imported.type === 'Identifier')  {
            return { type: 'Identifier', name: node.imported.name }
          }

          throw new Error('Provide `local` value when `imported` is not an `Identifier`')
        },
        validate: a.node('Identifier')
      }
    }
  },
  ImportDefaultSpecifier: {
    indices: {
      local: 0
    },
    fields: {
      local: {
        validate: a.node('Identifier')
      }
    }
  },
  ImportNamespaceSpecifier: {
    indices: {
      local: 0
    },
    fields: {
      local: {
        validate: a.node('Identifier')
      }
    }
  },
  ExportSpecifier: {
    indices: {
      local: 0,
      exported: 1
    },
    fields: {
      local: {
        validate: a.OR(a.node('Identifier'), a.node('Literal'))
      },
      exported: {
        default: ({ local }) => structuredClone(local),
        validate: a.OR(a.node('Identifier'), a.node('Literal'))
      }
    }
  },
  PrivateIdentifier: {
    indices: {
      name: [1, false]
    },
    fields: {
      name: {
        validate: a.chain(
          a.value('string'),
          a.validIdentifier(false)
        )
      }
    }
  },
  PropertyDefinition: {
    indices: {
      key: 0,
      value: 1,
      computed: [2, false],
      static: [3, false]
    },
    fields: {
      key: {
        validate: a.OR(a.nodeAlias('Expression'), a.node('PrivateIdentifier'))
      },
      value: {
        validate: a.nullable(a.nodeAlias('Expression'))
      },
      computed: {
        default: false,
        validate: a.value('boolean')
      },
      static: {
        default: false,
        validate: a.value('boolean')
      }
    }
  },
  StaticBlock: {
    indices: {
      body: 0,
      innerComments: false
    },
    fields: {
      body: {
        validate: a.arrayOf(a.nodeAlias('Statement'))
      },
      innerComments: anyValidate
    }
  },

  /// JSX
  JSXIdentifier: {
    indices: {
      name: [0, false]
    },
    fields: {
      name: {
        validate: a.chain(
          a.value('string'),
          a.validIdentifier(true)
        )
      }
    }
  },
  JSXNamespacedName: {
    indices: {
      namespace: 0,
      name: 1,
    },
    fields: {
      namespace: {
        validate: a.node('JSXIdentifier')
      },
      name: {
        validate: a.node('JSXIdentifier')
      }
    }
  },
  JSXMemberExpression: {
    indices: {
      object: 0,
      property: 0
    },
    fields: {
      object: {
        validate: a.node('JSXIdentifier', 'JSXMemberExpression')
      },
      property: {
        validate: a.node('JSXIdentifier')
      }
    }
  },
  JSXEmptyExpression: {
    indices: {},
    fields: {}
  },
  JSXExpressionContainer: {
    indices: {
      expression: 0
    },
    fields: {
      expression: {
        validate: a.OR(a.nodeAlias('Expression'), a.node('JSXEmptyExpression'))
      }
    }
  },
  JSXSpreadAttribute: {
    indices: {
      argument: 0
    },
    fields: {
      argument: {
        validate: a.nodeAlias('Expression')
      }
    }
  },
  JSXAttribute: {
    indices: {
      name: 0,
      value: 1
    },
    fields: {
      name: {
        validate: a.node('JSXIdentifier', 'JSXNamespacedName')
      },
      value: {
        validate: a.nullable(a.node('Literal', 'JSXExpressionContainer', 'JSXElement', 'JSXFragment'))
      }
    }
  },
  JSXClosingElement: {
    indices: {
      name: 0
    },
    fields: {
      name: {
        validate: a.node('JSXIdentifier', 'JSXNamespacedName', 'JSXMemberExpression')
      }
    }
  },
  JSXClosingFragment: {
    indices: {},
    fields: {}
  },
  JSXElement: {
    indices: {
      openingElement: 0,
      children: [2, 1],
      closingElement: [1, 2]
    },
    fields: {
      openingElement: {
        validate: a.node('JSXOpeningElement')
      },
      children: {
        validate: a.arrayOf(a.node('JSXExpressionContainer', 'JSXElement', 'JSXFragment', 'JSXText', 'JSXSpreadChild')),
        default: []
      },
      closingElement: {
        validate: a.nullable(a.node('JSXClosingElement'))
      }
    }
  },
  JSXFragment: {
    indices: {
      openingFragment: 0,
      children: [2, 1],
      closingFragment: [1, 2]
    },
    fields: {
      openingFragment: {
        validate: a.node('JSXOpeningFragment')
      },
      children: {
        validate: a.arrayOf(a.node('JSXExpressionContainer', 'JSXElement', 'JSXFragment', 'JSXText', 'JSXSpreadChild')),
        default: []
      },
      closingFragment: {
        validate: a.node('JSXClosingFragment')
      }
    }
  },
  JSXOpeningElement: {
    indices: {
      name: 0,
      attributes: 1,
      selfClosing: [2, false]
    },
    fields: {
      name: {
        validate: a.node('JSXIdentifier', 'JSXNamespacedName', 'JSXMemberExpression')
      },
      attributes: {
        validate: a.arrayOf(a.node('JSXSpreadAttribute', 'JSXAttribute')),
        default: []
      },
      selfClosing: {
        validate: a.value('boolean'),
        default: false
      }
    }
  },
  JSXOpeningFragment: {
    indices: {},
    fields: {}
  },
  JSXSpreadChild: {
    indices: {
      expression: 0
    },
    fields: {
      expression: {
        validate: a.nodeAlias('Expression')
      }
    }
  },
  JSXText: {
    indices: {
      value: [0, false],
      raw: false
    },
    fields: {
      value: {
        validate: a.value('string')
      },
      raw: anyValidate
    }
  }
})

export const getFieldsOf = ({ indices }: Definition, type: 'builder' | 'visitor'): string[] => {
  const fields: { name: string, index: number }[] = []

  Object.keys(indices).forEach((fieldName) => {
    const indexValue: DefinitionIndex<true | false> = (indices as any)[fieldName]
    if (indexValue === false) return
    switch (typeof indexValue) {
      case 'number':
        return fields.push({ name: fieldName, index: indexValue })
      case 'object': {
        const index = indexValue[type === 'builder' ? 0 : 1]
        if (index === false) return
        return fields.push({ name: fieldName, index: index })
      }
    }
  })

  return fields.sort((a, b) => a.index - b.index).map(({ name }) => name)
}

export const visitorKeys = (() => {
  const record: Record<string, readonly string[] | undefined> = Object.create(null)

  for (const nodeType in definitions) {
    record[nodeType] = getFieldsOf((definitions as Record<string, Definition>)[nodeType], 'visitor')
  }

  return record as Readonly<typeof record>
})()
