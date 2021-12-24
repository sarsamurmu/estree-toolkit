# Scope

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
Returns `null` if no binding can be found.

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

### `hasGlobalBinding(name)`
- `name`: <`string`> The name of the global binding
- Returns: <`boolean`> If the global binding exists

Checks if the global binding exists in the scope.

```js
const ast = parseModule(`
const mod = require('mod');

window.location.reload();
`);

traverse(ast, {
  $: { scope: true },
  Program(path) {
    path.scope.hasGlobalBinding('mod') // => false
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
