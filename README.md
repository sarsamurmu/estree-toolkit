<h1 align=center>
  <code>estree-toolkit</code>
</h1>
<h4 align=center>Tools for working with ESTree AST</h4>
<p align=center>
  <a href="https://npmjs.com/package/estree-toolkit">
    <img alt="npm" src="https://img.shields.io/npm/v/estree-toolkit?style=flat-square">
  </a>
  <a href="https://circleci.com/gh/sarsamurmu/estree-toolkit">
    <img alt="Circle CI" src="https://circleci.com/gh/sarsamurmu/estree-toolkit.svg?style=svg">
  </a>
  <a href="https://codecov.io/gh/sarsamurmu/estree-toolkit">
    <img alt="codecov" src="https://img.shields.io/codecov/c/github/sarsamurmu/estree-toolkit?style=flat-square">
  </a>
  <a href="https://github.com/sarsamurmu/estree-toolkit/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/sarsamurmu/estree-toolkit?style=flat-square">
  </a>
</p>

## Installation
```bash
npm i estree-toolkit
# or
yarn add estree-toolkit
```

## Basic operations
### Traversing an AST
```js
const { traverse } = require('estree-toolkit');

traverse(ast, {
  Program(path) {
    // Do something with the path
  }
});
```
### Building Nodes
```js
const { builders: b } = require('estree-toolkit');

b.identifier('x'); // => { type: 'Identifier', name: 'x' }
```
### Checking node types
```js
const { traverse, is } = require('estree-toolkit');
const { parseModule } = require('meriyah');

const ast = parseModule(`x = 0`);

traverse(ast, {
  AssignmentExpression(path) {
    if (is.identifier(path.node.left, { name: 'x' })) {
      // `left` is an identifier with name `x`
    }
  }
});
```
### Replacing a node
```js
const { traverse, builders: b } = require('estree-toolkit');
const { parseModule } = require('meriyah');

const ast = parseModule('a = b');

traverse(ast, {
  Identifier(path) {
    if (path.node.name === 'a') {
      path.replaceWith(b.identifier('c'));
    }
  }
});

// Now the AST represents - `c = b`
```
### Collecting scope information
```js
const { traverse } = require('estree-toolkit');

traverse(ast, {
  // Enable scope
  $: { scope: true },
  Program(path) {
    // `path.scope` is now available in all paths
  }
});
```
#### Checking if a binding is available
```js
const { traverse } = require('estree-toolkit');
const { parseModule } = require('meriyah');

const ast = parseModule(`
import { a } from 'source';

const { b, c: [d, { e }] } = a;
`);

traverse(ast, {
  $: { scope: true },
  Program(path) {
    path.scope.hasBinding('a') // => true
    path.scope.hasBinding('b') // => true
    path.scope.hasBinding('c') // => false
    path.scope.hasBinding('d') // => true
    path.scope.hasBinding('e') // => true
  }
});
```
#### Getting all references of a binding
```js
const { traverse } = require('estree-toolkit');
const { parseModule } = require('meriyah');

const ast = parseModule(`
import { a } from 'source';

fn(a);
s = a;
let obj = { a };
`);

traverse(ast, {
  $: { scope: true },
  Program(path) {
    // Returns all the paths that reference the binding `a`
    path.scope.getBinding('a').references // => [NodePath, NodePath, NodePath]
  }
});
```
#### Checking if a global have been used
```js
const { traverse } = require('estree-toolkit');
const { parseModule } = require('meriyah');

const ast = parseModule(`
const fx = require('fx-mod');
`);

traverse(ast, {
  $: { scope: true },
  Program(path) {
    path.hasGlobalBinding('require') // => true
  }
});
```
### Utilities
There are several static utilities that you can use.
- `evaluate`\
  Evaluates the given path. For now it only supports evaluation of logical, binary and unary operations.
  ```js
  const { utils: u } = require('estree-toolkit');
  // We are using `meriyah` but you can use any parser (like `acorn`)
  const { parseModule } = require('meriyah');

  traverse(parseModule(`1 + 2`), {
    BinaryExpression(path) {
      u.evaluate(path) // => { value: 3 }
    }
  });

  traverse(parseModule(`1 === 2`), {
    BinaryExpression(path) {
      u.evaluate(path) // => { value: false }
    }
  });

  traverse(parseModule(`iDoNotKnowWhatThisIs === 55`), {
    BinaryExpression(path) {
      u.evaluate(path) // => undefined
    }
  });
  ```
- `evaluateTruthy`\
  Evaluates the path for truthiness and returns `true`, `false` or `undefined` depending on
  evaluation result.
- `hasBinding`\
  Checks if any binding with the name is available in the containing scope.
  ```js
  const { utils: u } = require('estree-toolkit');
  const { parseModule } = require('meriyah');

  const ast = parseModule(`
    {
      let a;
      {
        id1;
      }
    }

    id2;
  `);

  traverse(ast, {
    Identifier(path) {
      if (path.node.name === 'id1') {
        u.hasBinding(path, 'a') // => true
      } else if (path.node.name === 'id2') {
        u.hasBinding(path, 'a') // => false
      }
    }
  });
  ```

## Documentation
The documentation is work in progress. You can find the documentation at https://estree-toolkit.netlify.app/

## License
Licensed under the [MIT License](/LICENSE).
