---
title: Is
---

`is` is used to check node type of any node. Just like `builders`
all the methods are named after node types.

```js
const { is } = require('estree-toolkit');
```

------------------------------------

## Usage
### Node type checking
```js
// Suppose `path` is a NodePath, we want to know
// what kind of path is `path`

if (is.identifier(path)) {
  console.log('Path is an Identifier')
}

if (is.blockStatement(path)) {
  console.log('Path is a BlockStatement')
}

// You can also pass `Node` instead of `NodePath`
if (is.literal(someNode)) {
  // `someNode` is an ArrayExpression
}
```

------------------------------------

### Aliases type checking
Aliases combine two or more node types.
For example, the alias `Function` means `FunctionDeclaration`, `FunctionExpression`
and `ArrowFunctionExpression`

All available aliases are
- `Function`
- `Statement`
- `Declaration`
- `Expression`
- `Pattern`
- `Class`
- `ExportDeclaration`
- `Loop`
- `ModuleDeclaration`

```js
if (is.loop(path)) {
  // `path` is a loop
  // it can be any kind of loop
  // for, for-in, for-of, do-while, while
}
```

------------------------------------------

### Using `Matcher`
`Matcher` is the second object that you can pass to any `is` function.
It check if the properties of matcher object matches the node's properties.

```js
if (is.identifier(path, { name: 'x' })) {
  // `path` is an Identifier with name `x`
}

// You can also use functions for complex checks

if (is.arrayExpression(path, {
  // Loop through all elements
  elements: (els, node) => els.reduce((prev, el) => 
    // Check type of each element
    prev && is.literal(el, { value: (v) => typeof v === 'number' }), true)
})) {
  // This checks if an array's all elements are number
  // [1, 2, 3, 4] -> Passes this test
  // [1, 2, 3, {}] -> Fails this test
}
```

---------------------------------------

### Deep checks
`is` does not do deep checks. It will only check for the first level properties,
it would not check nested properties. You should use function for doing deep checks.

```js
// Suppose we are checking for array with
// exactly this structure: [5, 8, 1, 6]

// This would not work
if (is.arrayExpression(path, {
  elements: [
    { type: 'Literal', value: 5 },
    { type: 'Literal', value: 8 },
    { type: 'Literal', value: 1 },
    { type: 'Literal', value: 6 }
  ]
})) {
  /// Do something with this
}

// This would work
if (is.arrayExpression(path, {
  elements: (elements, node) => {
    const nums = [5, 8, 1, 6]
    return elements.reduce((prev, el, idx) =>
      prev && is.literal(el, { value: nums[idx] }), true)
  }
})) {
  /// Do something with this
}
```
