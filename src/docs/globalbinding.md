---
title: GlobalBinding
---

`GlobalBinding` is like `Binding` but for globals. It tracks usage of a variable
that is not declared, but is being used.

```js
const { traverse } = require('estree-toolkit');
const { parseModule } = require('meriyah');

const ast = parseModule(`
document.querySelector('.class')
window.location.reload();
x = 7;
`);

traverse(ast, {
  $: { scope: true },
  Program(path) {
    path.scope.globalBindings
    /* => 
      {
        document: GlobalBinding { ... },
        window: GlobalBinding { ... },
        x: GlobalBinding { ... }
      }
    */
  }
});
```

-------------------------

## Properties

### `kind`
- Type: `'global'`

For `GlobalBinding`s, the kind is constant and it's `'global'`.

### `name`
- Type: `string`

The name of the global binding.

### `references`
- Type: `NodePath[]`

All paths that references this global binding.

### `constantViolations`
- Type: `NodePaths[]`

All paths that reassigns the value of this global binding.

### `constant`
- Type: `false`

For global bindings we can't know for sure if the binding is constant,
because other modules/files can change value of global bindings anytime.
So any global binding's `constant` would be always `false`.
