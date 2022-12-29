import { traverse } from '<project>'

import { parseModule } from 'meriyah'


test('remove reference', () => {
  const ast = parseModule(`
    const a = 0;

    fn(a);
    window['value'] = a;
  `)

  traverse(ast, {
    $: { scope: true },
    Program(path) {
      const binding = path.scope.bindings.a

      expect(binding.references).toHaveLength(2)
      binding.removeReference(binding.references[0])
      expect(binding.references).toHaveLength(1)
    }
  })
})

test('remove constantViolation', () => {
  const ast = parseModule(`
    const a = 0;

    a = fn(a)
    a = 99
    a = fn(a)
  `)

  traverse(ast, {
    $: { scope: true },
    Program(path) {
      const binding = path.scope.bindings.a

      expect(binding.constantViolations).toHaveLength(3)
      binding.removeConstantViolation(binding.constantViolations[0])
      expect(binding.constantViolations).toHaveLength(2)
    }
  })
})

test('checks if a binding is constant', () => {
  traverse(parseModule(`
    const a = 0;
    fn(a);
    window['value'] = a;

    const b = 0;
    b = 1;
  `), {
    $: { scope: true },
    Program(path) {
      expect(path.scope.bindings.a.constant).toBe(true)
      expect(path.scope.bindings.b.constant).toBe(false)
    }
  })
})
