---
title: Scope
---

`Scope` contains information about the scope, like all the declared variables (bindings),
references of a specific variable, labels etc.

By default, scope tracking is disabled. After [enabling it using options](./traversal#options),
it would be available in [`NodePath.scope`](./nodepath#scope).
```js
const { traverse } = require('estree-toolkit');

traverse(ast, {
  $: { scope: true },
  Program(path) {
    path.scope // This is our `Scope`
  }
});
```

---------------------------------------------------

## Properties
### `path`
- Type: `NodePath`

The path the current scope is associated with.

### `parent`
- Type: `Scope | null`
  
The parent of the current scope, if there is any. If there is no parent scope
then it would be `null`.

### `children`
- Type: `Scope[]`

An array containing all the direct descendent scopes of the current scope.

### `bindings`
- Type: `Record<string, Binding>`

All the bindings defined in the current scope. Contains information about the bindings.

### `globalBindings`
- Type: `Record<string, GlobalBinding>`

All unresolved references in the scope would be treated as a global variable, and
they would be mapped to this object.

### `labels`
- Type: `Record<string, Label>`

All labels that are defined in the current scope.

---------------------------------

## Methods

### `getProgramScope()`
- Returns: <`Scope`> The program scope

Returns the `Scope` associated with the `Program` node of the AST.

```js
const ast = parseModule(`x`);
let programScope;

traverse(ast, {
  $: { scope: true },
  Program(path) {
    programScope = path.scope;
  },
  Identifier(path) {
    path.scope.getProgramScope() === programScope // => true
  }
});
```

### `crawl()`

Crawl the tree and create all the scope information. Whenever you make a change to the AST
(like defining a variable, introducing a new global binding etc.), the `Scope` would not reflect the
changes. You would have to run the `crawl()` function manually in order to update the scope information.
It's recommended that you run this function on `Scope` associated with the `Program` node. 

```js
traverse(ast, {
  $: { scope: true },
  Program(path) {
    path.scope.crawl();
  }
})
```

Note that this function recreates all the information, so there is some overhead. Don't overdo it, or it
will impact on your app's performance.

### `hasOwnBinding(name)`
- `name`: <`string`> The name of the binding
- Returns: <`boolean`> If the binding exists

Checks if the binding exists in the **current scope**. Unlike [`hasBinding(name)`](#hasbindingname)
it doesn't check the parent scopes.

```js
const ast = parseModule(`
  let x;

  {
    let y;

    target;
  }
`);

traverse(ast, {
  $: { scope: true },
  Identifier(path) {
    if (path.node.name === 'target') {
      path.scope.hasOwnBinding('x') // => false
      path.scope.hasOwnBinding('y') // => true
    }
  }
});
```

### `getOwnBinding(name)`
- `name`: <`string`> The name of the binding
- Returns: <`Binding`> The binding with the provided name

Checks the **current scope** for the binding. If found, returns the binding information.
Returns `undefined` if no binding can be found.

```js
const ast = parseModule(`
  let x;

  {
    let y;

    target;
  }
`);

traverse(ast, {
  $: { scope: true },
  Identifier(path) {
    if (path.node.name === 'target') {
      path.scope.getOwnBinding('x') // => undefined
      path.scope.getOwnBinding('y') // => Binding { ... }
    }
  }
});
```

### `hasBinding(name)`
- `name`: <`string`> The name of the binding
- Returns: <`boolean`> If the binding exists

Checks if the binding exists in the **current scope** or **parent scopes**.

```js
const ast = parseModule(`
  let x;

  {
    let y;

    target;
  }
`);

traverse(ast, {
  $: { scope: true },
  Identifier(path) {
    if (path.node.name === 'target') {
      path.scope.hasBinding('x') // => true
      path.scope.hasBinding('y') // => true
    }
  }
});
```

### `getBinding(name)`
- `name`: <`string`> The name of the binding
- Returns: <`Bindings`> The binding with the provided name

Checks the **current scope** and **parent scopes** for the binding. If found, returns the
binding information. Returns `null` if no binding can be found.

```js
const ast = parseModule(`
  let x;

  {
    let y;

    target;
  }
`);

traverse(ast, {
  $: { scope: true },
  Identifier(path) {
    if (path.node.name === 'target') {
      path.scope.getBinding('x') // => Binding { ... }
      path.scope.getBinding('y') // => Binding { ... }
    }
  }
});
```

### `hasGlobalBinding(name)`
- `name`: <`string`> The name of the global binding
- Returns: <`boolean`> If the global binding exists

Checks if the global binding exists in the scope.

```js
const ast = parseModule(`
const module = require('mod');

window.location.reload();
`);

traverse(ast, {
  $: { scope: true },
  Program(path) {
    path.scope.hasGlobalBinding('module') // => false
    path.scope.hasGlobalBinding('require') // => true
    path.scope.hasGlobalBinding('window') // => true
  }
});
```

### `getGlobalBinding(name)`
- `name`: <`string`> The name of the global binding
- Returns: <`GlobalBinding`> The global binding with the provided name

Returns the global binding with the provided name. Returns `undefined` if no
binding can be found.

### `hasLabel(name)`
- `name`: <`string`> The name of the label
- Returns: <`boolean`> If the label exists

Checks if the label exists in the scope.

```js
const ast = parseModule(`

loop: for (let i = 0; i < 1000; i++) {
  for (let j = 0; j < 1000; j++) {
    if (i === 500 && j === 200) {
      target;
      break loop;
    }
  }
}

`);

traverse(ast, {
  $: { scope: true },
  Identifier(path) {
    if (path.node.name === 'target') {
      path.scope.hasLabel('loop') // => true
    }
  }
});
```

### `getLabel(name)`
- `name`: <`string`> The name of the label
- Returns: <`Label`> The label with the provided name

Returns the label with the provided name. Returns `undefined` if no label can be
found.

### `getAllBindings(...kind)`
- `kind`: <`string[]`> The kind of binding, that it will collect
- Return: <`Record<string, Binding>`> A record of bindings

Returns all the bindings available in a scope including its parents' bindings.
Maintains variable shadowing.

```js
const ast = parseModule(`
  const a = 0;
  let b = 0;
  var c = 0;

  function Fn(param_1, {param_2}) {
    const e = 0;
    let f = 0;
    var g = 0;
    target;
  }

  class Cls {}
`);

traverse(ast, {
  $: { scope: true },
  Identifier(path) {
    if (path.node.name === 'target') {
      // Get all kind of binding
      path.scope.getAllBindings()
      // =>
      // {
      //   a: Binding {...},
      //   b: Binding {...},
      //   c: Binding {...},
      //   Fn: Binding {...},
      //   param_1: Binding {...},
      //   param_2: Binding {...},
      //   e: Binding {...},
      //   f: Binding {...},
      //   g: Binding {...},
      //   Cls: Binding {...},
      // }

      // Get only binding with type `const` and `hoisted`
      path.scope.getAllBindings('const', 'hoisted')
      // =>
      // {
      //   a: Binding {...},
      //   e: Binding {...},
      //   Fn: Binding {...},
      //   Cls: Binding {...},
      // }
    }
  }
});
```

### `renameBinding(oldName, newName)`
- `oldName`: <`string`> The name of the binding which should be replaced
- `newName`: <`string`> New name of the binding

Renames all occurrence of the given binding. Covers all the possible cases.

```js
const ast = parseModule(`
  let { a } = global;

  f(a);

  ({a} = newValue);

  const x = ({ d, y: [f] } = a) => {
    target;
  }
`)

traverse(ast, {
  $: { scope: true },
  Identifier(path) {
    if (path.node.name === 'target') {
      // Rename `a` to `newA`
      path.scope.renameBinding('a', 'newA')
      // Rename `d` to `nD`
      path.scope.renameBinding('d', 'nD')
    }
  }
})

// Now if you generate code from the AST
// you would get this
//    let { a: newA } = global;
//
//    f(newA);
//
//    ({ a: newA } = newValue);
//
//    const x = ({ d: nD, y: [f] } = newA) => {
//      target;
//    }
```

:::Alert
This doesn't rename global binding or labels, only renames that are the bindings
declared in the program.
:::
