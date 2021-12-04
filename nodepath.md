# NodePath

## Properties

### `node`
- Type: `Node`

The node associated with the `NodePath`

### `type`
- Type: `string`

Type of the node that is associated the `NodePath`

### `key`
- Type: `string | number | null`

The current node's key in its parent

```javascript
const ast = {
  type: 'IfStatement',
  test: {
    type: 'Identifier',
    name: 'targetNode'
  },
  consequent: {
    type: 'EmptyStatement'
  },
  alternate: null
};

traverse(ast, {
  Identifier(path) {
    if (path.node.name === 'targetNode') {
      path.key === 'test' // => true
    }
  }
});
```

### `listKey`
- Type: `string | null`

If this node is part of an array, `listKey` would be the key of the array in its parent

```javascript
const ast = {
  type: 'ArrayExpression',
  elements: [
    {
      type: 'Identifier',
      name: 'targetNode'
    }
  ]
};

traverse(ast, {
  Identifier(path) {
    if (path.node.name === 'targetNode') {
      path.listKey === 'elements' // => true
      path.key === 0 // => true
    }
  }
});
```

### `removed`
- Type: `boolean`

If the node has been removed from its parent

### `parentPath`
- Type: `NodePath`

The parent path of the current path

### `parent`
- Type: `Node`

The parent node of the current path

### `container`
- Type: `Node | Node[] | null`

The container of the node

In this case `container` is an array
```javascript
const ast = {
  type: 'ArrayExpression',
  elements: [
    {
      type: 'Identifier',
      name: 'targetNode'
    }
  ]
};

traverse(ast, {
  Identifier(path) {
    if (path.node.name === 'targetNode') {
      path.container === ast.elements // => true
    }
  }
});
```

In this case `container` is a node object
```javascript
const ast = {
  type: 'IfStatement',
  test: {
    type: 'Identifier',
    name: 'targetNode'
  },
  consequent: {
    type: 'EmptyStatement'
  },
  alternate: null
};

traverse(ast, {
  Identifier(path) {
    if (path.node.name === 'targetNode') {
      path.container === ast // => true
    }
  }
});
```

## Methods

<!--
                                                                                         
 _|_|_|_|_|                                                                          _|  
     _|      _|  _|_|    _|_|_|  _|      _|    _|_|    _|  _|_|    _|_|_|    _|_|_|  _|  
     _|      _|_|      _|    _|  _|      _|  _|_|_|_|  _|_|      _|_|      _|    _|  _|  
     _|      _|        _|    _|    _|  _|    _|        _|            _|_|  _|    _|  _|  
     _|      _|          _|_|_|      _|        _|_|_|  _|        _|_|_|      _|_|_|  _|           
-->

### `skip()`

Skips the path from traversal

```javascript
const ast = {
  type: 'IfStatement',
  test: {
    type: 'Identifier',
    name: 'targetNode'
  },
  consequent: {
    type: 'EmptyStatement'
  },
  alternate: null
};
traverse(ast, {
  IfStatement(path) {
    path.get('test').skip();
  },
  Identifier() {
    // Never gets called because the path has been skipped
  }
});
```

### `unSkip()`

Un-skip the path from traversal. Whenever un-skipped, the path would be
traversed if it's not already traversed

### `unskip()`

Alias of `unSkip`

### `traverse(visitor, state)`
- `visitor`: <`Visitor`> Object to use as the visitor
- `state`: <`any`> The initial state

Traverse this path and its children with the given `visitor` and `state`

<!--
                                                                                 
   _|_|                                              _|                          
 _|    _|  _|_|_|      _|_|_|    _|_|      _|_|_|  _|_|_|_|  _|  _|_|  _|    _|  
 _|_|_|_|  _|    _|  _|        _|_|_|_|  _|_|        _|      _|_|      _|    _|  
 _|    _|  _|    _|  _|        _|            _|_|    _|      _|        _|    _|  
 _|    _|  _|    _|    _|_|_|    _|_|_|  _|_|_|        _|_|  _|          _|_|_|  
                                                                             _|  
                                                                         _|_|    
-->

### `findParent(predicate)`
- `predicate`: <`(path: NodePath) => boolean`> Callback function to predicate the parent
- Returns: <`NodePath`> The first NodePath for which the predicate function returned `true`

Starting at the parent path of this path and going up the tree,
returns first parent path where `predicate` is true

```javascript
const ast = {
  type: 'BlockStatement',
  body: [
    {
      type: 'BlockStatement',
      body: [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'Literal',
            value: 0
          }
        }
      ]
    }
  ]
};
   
traverse(ast, {
  Literal(path) {
    const blockParent = path.findParent(
      (parent) => parent.type === 'BlockStatement'
    ).node;
    blockParent === ast.body[0] // => true, Notice how it is not `ast` and is `ast.body[0]`
  }
});
```

### `find(predicate)`
- `predicate`: <`(path: NodePath) => boolean`> Callback function to predicate the parent
- Returns: <`NodePath`> The first NodePath for which the predicate function returned `true`

Starting from **this** path and going up the tree,
returns the first path where `predicate` is true

```javascript
const ast = {
  type: 'ExpressionStatement',
  expression: {
    type: 'Literal',
    value: 0
  }
};

traverse(ast, {
  Literal(path) {
    path.find((p) => p.type === 'Literal').node === ast.expression // => true
    path.find((p) => p.type === 'ExpressionStatement').node === ast // => true
  }
});
```

### `getFunctionParent()`
- Returns: <`NodePath`> The closest function parent

Going up the tree returns the NodePath's closest function parent

<!--
                                                                                                         
 _|      _|                  _|  _|      _|_|  _|                        _|      _|                      
 _|_|  _|_|    _|_|      _|_|_|        _|            _|_|_|    _|_|_|  _|_|_|_|        _|_|    _|_|_|    
 _|  _|  _|  _|    _|  _|    _|  _|  _|_|_|_|  _|  _|        _|    _|    _|      _|  _|    _|  _|    _|  
 _|      _|  _|    _|  _|    _|  _|    _|      _|  _|        _|    _|    _|      _|  _|    _|  _|    _|  
 _|      _|    _|_|      _|_|_|  _|    _|      _|    _|_|_|    _|_|_|      _|_|  _|    _|_|    _|    _|                                      
-->

### `insertBefore(nodes)`
- `nodes`: <`Node[]`> The nodes that would be inserted
- Returns: <`NodePath[]`> An array of NodePaths for the inserted nodes

Inserts the `nodes` before the current node

```javascript
const ast = {
  type: 'ArrayExpression',
  elements: [
    {
      type: 'Identifier',
      name: 'targetNode'
    }
  ]
};

traverse(ast, {
  Identifier(path) {
    if (path.node.name === 'targetNode') {
      const newPaths = path.insertBefore([
        {
          type: 'Literal',
          value: 1
        },
        {
          type: 'Literal',
          value: 2
        }
      ]);

      // `newPaths` are the paths for the inserted nodes
    }
  }
});

assert.deepEqual(ast, {
  type: 'ArrayExpression',
  elements: [
    {
      type: 'Literal',
      value: 1
    },
    {
      type: 'Literal',
      value: 2
    },
    {
      type: 'Identifier',
      name: 'targetNode'
    }
  ]
});
```

### `insertAfter(nodes)`
- `nodes`: <`Node[]`> The nodes that would be inserted
- Returns: <`NodePath[]`> An array of NodePaths for the inserted nodes

Inserts the `nodes` after the current node

```javascript
const ast = {
  type: 'ArrayExpression',
  elements: [
    {
      type: 'Identifier',
      name: 'targetNode'
    }
  ]
};

traverse(ast, {
  Identifier(path) {
    if (path.node.name === 'targetNode') {
      const newPaths = path.insertAfter([
        {
          type: 'Literal',
          value: 1
        },
        {
          type: 'Literal',
          value: 2
        }
      ]);

      // `newPaths` are the paths for the inserted nodes
    }
  }
});

assert.deepEqual(ast, {
  type: 'ArrayExpression',
  elements: [
    {
      type: 'Identifier',
      name: 'targetNode'
    },
    {
      type: 'Literal',
      value: 1
    },
    {
      type: 'Literal',
      value: 2
    }
  ]
});
```
