import { parseModule } from 'meriyah'
import { generate } from 'astring'

import { traverse, builders as b,  } from '<project>'
import { NodeT } from '<project>/estree'

test('reference collection', () => {
  const source = `
    // ----------------------------
    //      identifierCrawlers
    // ----------------------------
    (() => ArrowFunctionExpression_body);
    x = AssignmentExpression_right;
    ((x = AssignmentPattern_right) => 0);
    async () => { await AwaitExpression_argument }
    switch (x) { case SwitchCase_test: break; }
    let x = VariableDeclarator_init;
    ExpressionStatement_expression;
    () => { return ReturnStatement_argument };
    if (IfStatement_test);
    switch (SwitchStatement_discriminant) {}
    throw ThrowStatement_argument;
    while (WhileStatement_test);
    do {} while (DoWhileStatement_test);
    for (ForStatement_init; ForStatement_test; ForStatement_update);
    for (x in ForInStatement_right);
    for (x of ForOfStatement_right);
    class x extends ClassDeclaration_superClass {}
    (function *() { yield YieldExpression_argument });
    !UnaryExpression_argument;
    BinaryExpression_left + BinaryExpression_right;
    LogicalExpression_left || LogicalExpression_right;
    MemberExpression_object.x;
    x[MemberExpression_property];
    ConditionalExpression_test ? ConditionalExpression_consequent : ConditionalExpression_alternate;
    CallExpression_callee();
    new NewExpression_callee();
    TaggedTemplateExpression_tag\`\`;
    (class extends ClassExpression_superClass {});
    import.meta;
    import(ImportExpression_source);
    ({ [Property_key]: Property_value, x: x });
    [...SpreadElement_argument];
    class x { methodDefinition_key() {} [MethodDefinition_key_computed]() {} }
    export default ExportDefaultDeclaration_declaration;
    export { ExportSpecifier_local as x }
    export * as exportAllDeclaration_exported from '';
    class x { propertyDefinition_key = PropertyDefinition_value }
    // --------------------- JSX ----------------------------
    <a b={JSXExpressionContainer_expression} />;
    <a {...JSXSpreadAttribute_argument} />;
    <a>{...JSXSpreadChild_expression}</a>;

    // ----------------------------
    //   jsxIdentifierCrawlers
    // ----------------------------
    <JSXNamespacedName_namespace:jsxNamespacedName_name />;
    <jsxNamespacedName_namespace:x />;
    <a jsxAttribute_name={x} />;
    <JSXClosingElement_nameOne></JSXClosingElement_nameOne>;
    <JSXMemberExpression_object.jsxMemberExpression_property />;
    <JSXOpeningElement_nameOne />;

    // ----------------------------
    //   inListIdentifierCrawlers
    // ----------------------------
    [ArrayExpression_elements];
    x(CallExpression_arguments);
    new x(NewExpression_arguments);
    (SequenceExpression_expressions, x);
    \`\${TemplateLiteral_expressions}\`;
  `
  const ast = parseModule(source, { next: true, jsx: true })
  const referencedIdentifiers = [...source.matchAll(/\b([A-Z][a-z]+)+_[A-Za-z]+\b/gm)].map((m) => m[0])

  traverse(ast, {
    $: { scope: true },
    Program(path) {
      const bindingNames = Object.keys(path.scope.globalBindings)
      expect(bindingNames).toEqual(expect.arrayContaining(referencedIdentifiers))
      expect(bindingNames).not.toEqual(expect.arrayContaining(['import']))
      expect(
        Object.values(path.scope.globalBindings).map((b) => b.kind)
      ).toEqual(Array(bindingNames.length).fill('global'))
    }
  })

  expect.assertions(3)
})

describe('label', () => {
  describe('registration', () => {
    test('for..in and for..of statement', () => {
      const ast = parseModule(`
        forOf: for (i of x);
        forIn: for (i in x);
      `)

      traverse(ast, {
        $: { scope: true },
        ForOfStatement(path) {
          expect(path.scope.labels.forOf).toBeTruthy()
          expect(path.scope.labels.forIn).toBe(undefined)
        },
        ForInStatement(path) {
          expect(path.scope.labels.forIn).toBeTruthy()
          expect(path.scope.labels.forOf).toBe(undefined)
        }
      })

      expect.assertions(2 * 2)
    })

    test('block statement', () => {
      const ast = parseModule(`
        blockLabel: {
          undefined
        }
      `)

      traverse(ast, {
        $: { scope: true },
        BlockStatement(path) {
          expect(path.scope.labels.blockLabel).toBeTruthy()
        }
      })

      expect.assertions(1)
    })
  })

  test('reference', () => {
    const ast = parseModule(`
      block: {
        break block;
      }
      forS: for (;;) {
        break forS;
        continue forS;
      }
      forOf: for (x of o) {
        break forOf;
        continue forOf;
      }
      forIn: for (x in o) {
        break forIn;
        continue forIn;
      }
    `)

    traverse(ast, {
      $: { scope: true },
      BlockStatement(path) {
        if (path.parent.type !== 'LabeledStatement') return
        const { references } = path.scope.labels.block
        expect(references).toHaveLength(1)
        expect(references[0].parent.type).toBe('BreakStatement')
      },
      ForStatement(path) {
        const { references } = path.scope.labels.forS
        expect(references).toHaveLength(2)
        expect(references.map((ref) => ref.parent.type)).toEqual(['BreakStatement', 'ContinueStatement'])
      },
      ForOfStatement(path) {
        const { references } = path.scope.labels.forOf
        expect(references).toHaveLength(2)
        expect(references.map((ref) => ref.parent.type)).toEqual(['BreakStatement', 'ContinueStatement'])
      },
      ForInStatement(path) {
        const { references } = path.scope.labels.forIn
        expect(references).toHaveLength(2)
        expect(references.map((ref) => ref.parent.type)).toEqual(['BreakStatement', 'ContinueStatement'])
      }
    })

    expect.assertions(4 * 2)
  })
})

describe('binding registration', () => {
  test('from variable declaration', () => {
    const ast = parseModule(`
      const { a, b: [, c, { d }], e: f = 0, ...g } = x;
    `)

    traverse(ast, {
      $: { scope: true },
      Program(path) {
        const bindingNames = Object.keys(path.scope.bindings)
        expect(bindingNames).toHaveLength(5)
        expect(bindingNames).toEqual(expect.arrayContaining(['a', 'c', 'd', 'f', 'g']))
        expect(Object.values(path.scope.bindings).map((b) => b.kind)).toEqual(Array(5).fill('const'))
      }
    })

    expect.assertions(3)
  })

  test('from ImportSpecifier', () => {
    const ast = parseModule(`
      import { a as b, c } from '';
    `)

    traverse(ast, {
      $: { scope: true },
      Program(path) {
        const { a: aBinding, b: bBinding, c: cBinding } = path.scope.bindings
        expect(aBinding).toBeUndefined()
        expect(bBinding.kind).toBe('module')
        expect(bBinding.identifierPath.type).toBe('Identifier')
        expect(bBinding.identifierPath.node.name).toBe('b')
        expect(bBinding.path.type).toBe('ImportSpecifier')
        expect(cBinding.kind).toBe('module')
        expect(cBinding.identifierPath.type).toBe('Identifier')
        expect(cBinding.identifierPath.node.name).toBe('c')
        expect(cBinding.path.type).toBe('ImportSpecifier')
      }
    })

    expect.assertions(9)
  })

  test('from ImportDefaultSpecifier', () => {
    const ast = parseModule(`
      import a from '';
    `)

    traverse(ast, {
      $: { scope: true },
      Program(path) {
        const binding = path.scope.bindings.a
        expect(binding.kind).toBe('module')
        expect(binding.identifierPath.type).toBe('Identifier')
        expect(binding.identifierPath.node.name).toBe('a')
        expect(binding.path.type).toBe('ImportDefaultSpecifier')
      }
    })

    expect.assertions(4)
  })

  test('from ImportNamespaceSpecifier', () => {
    const ast = parseModule(`
      import * as a from '';
    `)

    traverse(ast, {
      $: { scope: true },
      Program(path) {
        const binding = path.scope.bindings.a
        expect(binding.kind).toBe('module')
        expect(binding.identifierPath.type).toBe('Identifier')
        expect(binding.identifierPath.node.name).toBe('a')
        expect(binding.path.type).toBe('ImportNamespaceSpecifier')
      }
    })

    expect.assertions(4)
  })

  test('from for, for..in and for..of statement', () => {
    const ast = parseModule(`
      for (var { a, b: [, c, { d }], e: f = 0, ...g } = x;;);
      for (let { h, i: [, j, { k }], l: m = 0, ...n } in x);
      for (const { o, p: [, q, { r }], s: t = 0, ...u } of x);
    `)

    traverse(ast, {
      $: { scope: true },
      ForStatement(path) {
        const bindingNames = Object.keys(path.scope.bindings)
        expect(bindingNames).toHaveLength(5)
        expect(bindingNames).toEqual(expect.arrayContaining(['a', 'c', 'd', 'f', 'g']))
        expect(
          Object.values(path.scope.bindings).map((b) => b.kind)
        ).toEqual(Array(bindingNames.length).fill('var'))
      },
      ForInStatement(path) {
        const bindingNames = Object.keys(path.scope.bindings)
        expect(bindingNames).toHaveLength(5)
        expect(bindingNames).toEqual(expect.arrayContaining(['h', 'j', 'k', 'm', 'n']))
        expect(
          Object.values(path.scope.bindings).map((b) => b.kind)
        ).toEqual(Array(bindingNames.length).fill('let'))
      },
      ForOfStatement(path) {
        const bindingNames = Object.keys(path.scope.bindings)
        expect(bindingNames).toHaveLength(5)
        expect(bindingNames).toEqual(expect.arrayContaining(['o', 'q', 'r', 't', 'u']))
        expect(
          Object.values(path.scope.bindings).map((b) => b.kind)
        ).toEqual(Array(bindingNames.length).fill('const'))
      }
    })

    expect.assertions(3 * 3)
  })

  test('from FunctionDeclaration', () => {
    const ast = parseModule(`
      {
        function fnDec() {}
      }
    `)

    traverse(ast, {
      $: { scope: true },
      BlockStatement(path) {
        if (path.parent.type !== 'Program') return
        const fnBinding = path.scope.bindings.fnDec
        expect(fnBinding.kind).toBe('hoisted')
        expect(fnBinding.identifierPath.type).toBe('Identifier')
        expect(fnBinding.identifierPath.node.name).toBe('fnDec')
        expect(fnBinding.path.type).toBe('FunctionDeclaration')
      }
    })

    expect.assertions(4)
  })

  test('from ClassDeclaration', () => {
    const ast = parseModule(`
      {
        class classDec {}
      }
    `)

    traverse(ast, {
      $: { scope: true },
      BlockStatement(path) {
        if (path.parent.type !== 'Program') return
        const classBinding = path.scope.bindings.classDec
        expect(classBinding.kind).toBe('hoisted')
        expect(classBinding.identifierPath.type).toBe('Identifier')
        expect(classBinding.identifierPath.node.name).toBe('classDec')
        expect(classBinding.path.type).toBe('ClassDeclaration')
      }
    })

    expect.assertions(4)
  })

  test('from FunctionExpression', () => {
    const ast = parseModule(`
      (function fnExp() {})
    `)

    traverse(ast, {
      $: { scope: true },
      Program(path) {
        const fnBinding = path.scope.bindings.fnExp
        expect(fnBinding).toBeUndefined()
      },
      FunctionExpression(path) {
        const fnBinding = path.scope.bindings.fnExp
        expect(fnBinding.kind).toBe('local')
        expect(fnBinding.identifierPath.type).toBe('Identifier')
        expect(fnBinding.identifierPath.node.name).toBe('fnExp')
        expect(fnBinding.path.type).toBe('FunctionExpression')
      }
    })

    expect.assertions(5)
  })

  test('from ClassExpression', () => {
    const ast = parseModule(`
      (class classExp {})
    `)

    traverse(ast, {
      $: { scope: true },
      Program(path) {
        const classBinding = path.scope.bindings.fn
        expect(classBinding).toBeUndefined()
      },
      ClassExpression(path) {
        const classBinding = path.scope.bindings.classExp
        expect(classBinding.kind).toBe('local')
        expect(classBinding.identifierPath.type).toBe('Identifier')
        expect(classBinding.identifierPath.node.name).toBe('classExp')
        expect(classBinding.path.type).toBe('ClassExpression')
      }
    })

    expect.assertions(5)
  })

  test('from function parameters', () => {
    const ast = parseModule(`
      function fn({ a, b: c }, [, d, e], f = 0, ...g) {}

      (function ({ h, i: j }, [, k, l], m = 0, ...n) {})
    `)

    traverse(ast, {
      $: { scope: true },
      FunctionDeclaration(path) {
        const bindingNames = Object.keys(path.scope.bindings)
        expect(bindingNames).toHaveLength(6)
        expect(bindingNames).toEqual(expect.arrayContaining(['a', 'c', 'd', 'e', 'f', 'g']))
        expect(
          Object.values(path.scope.bindings).map((b) => b.kind)
        ).toEqual(Array(bindingNames.length).fill('param'))
      },
      FunctionExpression(path) {
        const bindingNames = Object.keys(path.scope.bindings)
        expect(bindingNames).toHaveLength(6)
        expect(bindingNames).toEqual(expect.arrayContaining(['h', 'j', 'k', 'l', 'm', 'n']))
        expect(
          Object.values(path.scope.bindings).map((b) => b.kind)
        ).toEqual(Array(bindingNames.length).fill('param'))
      }
    })

    expect.assertions(2 * 3)
  })

  test('from CatchClause', () => {
    const ast = parseModule(`
      try {} catch ({ message }) {}
    `)

    traverse(ast, {
      $: { scope: true },
      CatchClause(path) {
        const binding = path.scope.bindings.message
        expect(binding.kind).toBe('let')
        expect(binding.identifierPath.type).toBe('Identifier')
        expect(binding.identifierPath.node.name).toBe('message')
        expect(binding.path.type).toBe('CatchClause')
      }
    })

    expect.assertions(4)
  })
})

describe('constant violations', () => {
  test('in AssignmentExpression and UpdateExpression', () => {
    const ast = parseModule(`
      ({ a, b: [, c, { d }], e: f = 0, ...g } = x);
      h++;
    `)

    traverse(ast, {
      $: { scope: true },
      Program(path) {
        const { globalBindings } = path.scope
        delete globalBindings.x

        const bindingNames = Object.keys(globalBindings)
        expect(bindingNames).toHaveLength(6)
        expect(bindingNames).toEqual(expect.arrayContaining(['a', 'c', 'd', 'f', 'g', 'h']))

        for (const bindingName in globalBindings) {
          expect(globalBindings[bindingName].constantViolations).toHaveLength(1)
        }
      }
    })

    expect.assertions(2 + 6)
  })

  test('in for..in and for..of statement', () => {
    const ast = parseModule(`
      for ({ a, b: [, c, { d }], e: f = 0, ...g } in x);
      for ({ a, b: [, c, { d }], e: f = 0, ...g } of x);
    `)

    traverse(ast, {
      $: { scope: true },
      Program(path) {
        const { globalBindings } = path.scope
        delete globalBindings.x

        const bindingNames = Object.keys(globalBindings)
        expect(bindingNames).toHaveLength(5)
        expect(bindingNames).toEqual(expect.arrayContaining(['a', 'c', 'd', 'f', 'g']))

        for (const bindingName in globalBindings) {
          expect(globalBindings[bindingName].constantViolations).toHaveLength(2)
        }
      }
    })
  })
})

describe('methods', () => {
  test('hasBinding', () => {
    const ast = parseModule(`
      const a = 0

      {
        check
      }
    `)

    traverse(ast, {
      $: { scope: true },
      Identifier(path) {
        if (path.node.name === 'check') {
          expect(path.scope.hasBinding('a')).toBe(true)
          expect(path.scope.hasBinding('b')).toBe(false)
        }
      }
    })

    expect.assertions(2)
  })

  test('hasGlobalBinding', () => {
    const ast = parseModule(`
      a = 0

      {
        check
      }
    `)

    traverse(ast, {
      $: { scope: true },
      Identifier(path) {
        if (path.node.name === 'check') {
          expect(path.scope.hasGlobalBinding('a')).toBe(true)
          expect(path.scope.hasGlobalBinding('b')).toBe(false)
        }
      }
    })

    expect.assertions(2)
  })

  test('getGlobalBinding', () => {
    const ast = parseModule(`
      a = 0

      {
        a = 8
        a = 7
        x = a
        check
      }
    `)

    traverse(ast, {
      $: { scope: true },
      Identifier(path) {
        if (path.node.name === 'check') {
          expect(path.scope.getGlobalBinding('a').constantViolations.length).toBe(3)
          expect(path.scope.getGlobalBinding('a').references.length).toBe(1)
        }
      }
    })

    expect.assertions(2)
  })

  describe('getAllBindings', () => {
    test('all kind', () => {
      const ast = parseModule(`
        const a = 0
        const b = 0
        {
          const a = 0
          const c = 0
          const x = (d) => {
            it;
          }
        }
      `)

      traverse(ast, {
        $: { scope: true },
        Identifier(path) {
          if (path.node.name === 'it') {
            const allBinding = path.scope.getAllBindings()
            expect(Object.keys(allBinding)).toEqual(expect.arrayContaining(['a', 'b', 'c', 'd', 'x']));
            ((allBinding['a'].path.node as NodeT<'VariableDeclarator'>).init as NodeT<'Literal'>).value = 22
          }
        }
      })

      expect(generate(ast)).toMatchSnapshot()
    })

    test('specific kind', () => {
      const ast = parseModule(`
        const a = 0;
        let b = 0;
        var c = 0;

        function Fn(param_1, {param_2}) {
          const e = 0;
          let f = 0;
          var g = 0;
          it
        }

        class Cls {}
      `)

      traverse(ast, {
        $: { scope: true },
        Identifier(path) {
          if (path.node.name === 'it') {
            expect(Object.keys(path.scope.getAllBindings('const'))).toEqual(expect.arrayContaining(['a', 'e']))
            expect(Object.keys(path.scope.getAllBindings('let'))).toEqual(expect.arrayContaining(['b', 'f']))
            expect(Object.keys(path.scope.getAllBindings('var'))).toEqual(expect.arrayContaining(['c', 'g']))
            expect(Object.keys(path.scope.getAllBindings('hoisted'))).toEqual(expect.arrayContaining(['Fn', 'Cls']))
            expect(Object.keys(path.scope.getAllBindings('param'))).toEqual(expect.arrayContaining(['param_1', 'param_2']))
            expect(Object.keys(path.scope.getAllBindings('const', 'let'))).toEqual(expect.arrayContaining(['a', 'e', 'b', 'f']))
          }
        }
      })
    })
  })

  describe('crawl', () => {
    test('manages references when re-crawling', () => {
      const ast = parseModule(`
        let a, b
        c = 0

        block1: for (let y of z) {
          a = 5; b = 6;
          a = 6; b = 7;
          a = 7; b = 8;
          a = 8; b = 9;

          {
            stdel;

            a = 5+1; b = 6+1;
            a = 6+1; b = 7+1;
            a = 7+1; b = 8+1;
            a = 8+1; b = 9+1;

            if (globalBool1) break block1;
            if (globalBool2) continue block1;
            
            a.x = 2
            b.x = 3
            a.x = (2*a+3*b)/(2**a-5**b+c)
            b.x = (6*a**5+99.9*b+c)
            c = 0
            c = 7

            rec;
          }
        }
      `)
      let deletePaths = false

      traverse(ast, {
        $: { scope: true },
        Program(path) {
          expect(path.scope.getBinding('a').references.length).toBe(5)
          expect(path.scope.getBinding('a').constantViolations.length).toBe(8)
          expect(path.scope.getBinding('b').references.length).toBe(5)
          expect(path.scope.getBinding('b').constantViolations.length).toBe(8)
          expect(path.scope.getGlobalBinding('c').references.length).toBe(2)
          expect(path.scope.getGlobalBinding('c').constantViolations.length).toBe(3)
        },
        IfStatement(path) {
          if (deletePaths) path.remove()
        },
        ExpressionStatement: {
          leave(path) {
            if (deletePaths) path.remove()
          }
        },
        Identifier(path) {
          if (path.node.name === 'stdel') {
            deletePaths = true
          }

          if (path.node.name === 'rec') {
            deletePaths = false

            path.parentPath.insertBefore([
              b.expressionStatement(
                b.assignmentExpression('=', b.identifier('a'),
                  b.assignmentExpression('=', b.identifier('b'), b.literal(77)))
              ),
              b.expressionStatement(b.memberExpression(b.identifier('a'), b.identifier('x'))),
              b.expressionStatement(b.memberExpression(b.identifier('b'), b.identifier('x'))),
            ])

            expect(path.scope.getLabel('block1').references.length).toBe(2)

            path.scope.crawl()

            expect(path.scope.getBinding('a').references.length).toBe(1)
            expect(path.scope.getBinding('a').constantViolations.length).toBe(5)
            expect(path.scope.getBinding('b').references.length).toBe(1)
            expect(path.scope.getBinding('b').constantViolations.length).toBe(5)
            expect(path.scope.getGlobalBinding('c').references.length).toBe(0)
            expect(path.scope.getGlobalBinding('c').constantViolations.length).toBe(1)
            expect(path.scope.getLabel('block1').references.length).toBe(0)
          }
        }
      })

      expect(generate(ast)).toMatchSnapshot()
    })
  })

  describe('rename', () => {
    test('Common binding', () => {
      const ast = parseModule(`
        const a = obj;
        f(a);
        let x = (b = a) => b
      `)

      traverse(ast, {
        $: { scope: true },
        Program(path) {
          path.scope.renameBinding('a', 'c')
        }
      })

      expect(generate(ast)).toMatchSnapshot()
    })

    test('Patterns', () => {
      const ast = parseModule(`
        const { a } = global;
        rep_a_b;

        ({a} = newGlobal)

        const x = ({ d, y: [f] } = a) => {
          rep_d_e;
          rep_f_g;
        }
      `)

      traverse(ast, {
        $: { scope: true },
        Identifier(path) {
          let match
          if ((match = path.node.name.match(/rep_(\w+)_(\w+)/))) {
            path.scope.renameBinding(match[1], match[2])
          }
        }
      })

      expect(generate(ast)).toMatchSnapshot()
    })

    test('Replace binding in parent scope', () => {
      const ast = parseModule(`
        import {a} from '.'

        {
          {
            const b = 0;
            {
              const c = 0;
              rep;
            }
          }
        }
      `)

      traverse(ast, {
        $: { scope: true },
        Identifier(path) {
          if (path.node.name === 'rep') {
            path.scope.renameBinding('a', 'e')
            path.scope.renameBinding('b', 'f')
          }
        }
      })

      expect(generate(ast)).toMatchSnapshot()
    })

    test('Import-Export', () => {
      const ast = parseModule(`
        import {a} from '.'
        export {a}

        import b from '.'
        export {b as x}
      `)

      traverse(ast, {
        $: { scope: true },
        Program(path) {
          path.scope.renameBinding('a', 'e')
          path.scope.renameBinding('b', 'f')
        }
      })

      expect(generate(ast)).toMatchSnapshot()
    })
  })
})
