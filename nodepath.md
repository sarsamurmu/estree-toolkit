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

### `unshiftContainer(listKey, nodes)`
- `listKey`: <`string`> The list key of the container where the nodes would be inserted
- `nodes`: <`Node[]`> The nodes that would be inserted
- Returns: <`NodePath[]`> An array of NodePaths for the inserted nodes

Inserts child nodes at the **start** of the container

```javascript
const ast = {
  type: 'ArrayExpression',
  elements: [
    {
      type: 'Identifier',
      name: 'undefined'
    }
  ]
};

traverse(ast, {
  ArrayExpression(path) {
    const newPaths = path.unshiftContainer('elements', [
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
      name: 'undefined'
    }
  ]
});
```

### `pushContainer(listKey, nodes)`
- `listKey`: <`string`> The list key of the container where the nodes would be inserted
- `nodes`: <`Node[]`> The nodes that would be inserted
- Returns: <`NodePath[]`> An array of NodePaths for the inserted nodes

Inserts child nodes at the **end** of the container

```javascript
const ast = {
  type: 'ArrayExpression',
  elements: [
    {
      type: 'Identifier',
      name: 'undefined'
    }
  ]
};

traverse(ast, {
  ArrayExpression(path) {
    const newPaths = path.pushContainer('elements', [
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
});

assert.deepEqual(ast, {
  type: 'ArrayExpression',
  elements: [
    {
      type: 'Identifier',
      name: 'undefined'
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

<!--
                                                     
 _|_|_|_|                          _|  _|            
 _|        _|_|_|  _|_|_|  _|_|        _|  _|    _|  
 _|_|_|  _|    _|  _|    _|    _|  _|  _|  _|    _|  
 _|      _|    _|  _|    _|    _|  _|  _|  _|    _|  
 _|        _|_|_|  _|    _|    _|  _|  _|    _|_|_|  
                                                 _|  
                                             _|_|    
-->

### `get(key)`
- `key`: <`string`> The key of the child node
- Returns: <`NodePath | NodePath[]`> The NodePath/NodePaths of the child node/nodes for the given key

Get the current path's children's path for which the key is `key`

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
    const testPath = path.get('test');
    testPath.node === ast.test // => true
  }
});
```

### `getSibling(key)`
- `key`: <`string | number`> The key of the sibling node
- Returns: <`NodePath | undefined`> The NodePath of the sibling node

Get the path of current path's sibling for which the key is `key`

```javascript
const ast = {
  type: 'ArrayExpression',
  elements: [
    {
      type: 'Identifier',
      name: 'targetNode'
    },
    {
      type: 'Literal',
      value: 16
    },
    {
      type: 'Literal',
      value: 5
    }
  ]
};

traverse(ast, {
  Identifier(path) {
    if (path.node.name === 'targetNode') {
      path.getSibling(2).node === ast.elements[2] // => true
    }
  }
});
```

### `getOpposite()`
- Returns: <`NodePath`> The opposite NodePath

Get the opposite path of the current path

```javascript
const ast = {
  type: 'AssignmentExpression',
  left: {
    type: 'Identifier',
    name: 'a'
  },
  operator: '=',
  right: {
    type: 'Identifier',
    name: 'b'
  }
};

traverse(ast, {
  Identifier(path) {
    if (path.key === 'left') {
      path.getOpposite().node === ast.right // => true
    }
  }
});
```

### `getPrevSibling()`
- Returns: <`NodePath`> The previous NodePath

The the previous sibling's path of the current path

```javascript
const ast = {
  type: 'ArrayExpression',
  elements: [
    {
      type: 'Literal',
      value: 16
    },
    {
      type: 'Identifier',
      name: 'targetNode'
    },
    {
      type: 'Literal',
      value: 5
    }
  ]
};

traverse(ast, {
  Identifier(path) {
    if (path.node.name === 'targetNode') {
      path.getPrevSibling().node === ast.elements[0] // => true
    }
  }
});
```

### `getNextSibling()`
- Returns: <`NodePath`> The next NodePath

The the next sibling's path of the current path

```javascript
const ast = {
  type: 'ArrayExpression',
  elements: [
    {
      type: 'Literal',
      value: 16
    },
    {
      type: 'Identifier',
      name: 'targetNode'
    },
    {
      type: 'Literal',
      value: 5
    }
  ]
};

traverse(ast, {
  Identifier(path) {
    if (path.node.name === 'targetNode') {
      path.getNextSibling().node === ast.elements[2] // => true
    }
  }
});
```

### `getAllPrevSiblings()`
- Returns: `NodePath[]` An array containing paths of next siblings

Get all previous siblings' path of the current path
__NOTE__: Returned paths are reversed (they are sorted in how close
they are to the current path, see example)

```javascript
const ast = {
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
    },
    {
      type: 'Literal',
      value: 3
    },
    {
      type: 'Literal',
      value: 4
    }
  ]
};

traverse(ast, {
  Identifier(path) {
    if (path.node.name === 'targetNode') {
      const prevPaths = path.getAllPrevSiblings();
      prevPaths[0].node === ast.elements[1] // => true
      prevPaths[1].node === ast.elements[0] // => true
    }
  }
});
```

### `getAllNextSiblings()`
- Returns: <`NodePath[]`> An array containing paths of previous siblings

Get all next siblings' path of the current path

```javascript
const ast = {
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
    },
    {
      type: 'Literal',
      value: 3
    },
    {
      type: 'Literal',
      value: 4
    }
  ]
};

traverse(ast, {
  Identifier(path) {
    if (path.node.name === 'targetNode') {
      const nextPaths = path.getAllNextSiblings();
      nextPaths[0].node === ast.elements[3] // => true
      nextPaths[1].node === ast.elements[4] // => true
    }
  }
});
```

<!--
                                                                                                                           
 _|_|_|              _|                                                                    _|      _|                      
   _|    _|_|_|    _|_|_|_|  _|  _|_|    _|_|      _|_|_|  _|_|_|      _|_|      _|_|_|  _|_|_|_|        _|_|    _|_|_|    
   _|    _|    _|    _|      _|_|      _|    _|  _|_|      _|    _|  _|_|_|_|  _|          _|      _|  _|    _|  _|    _|  
   _|    _|    _|    _|      _|        _|    _|      _|_|  _|    _|  _|        _|          _|      _|  _|    _|  _|    _|  
 _|_|_|  _|    _|      _|_|  _|          _|_|    _|_|_|    _|_|_|      _|_|_|    _|_|_|      _|_|  _|    _|_|    _|    _|  
                                                           _|                                                              
                                                           _|                                                              
-->

### `has(key)`
- `key`: <`string`> The key to search for any kind of value
- Returns: <`boolean`> If the node has the value

Checks if the path has the specific property.
If value of the property is an array, checks if the array is not empty.

***Example - 1***
```javascript
const ast = {
  type: 'IfStatement',
  test: {
    type: 'Identifier',
    name: 'x'
  },
  consequent: {
    type: 'EmptyStatement'
  },
  alternate: null
};

traverse(ast, {
  IfStatement(path) {
    path.has('consequent') // => true
    path.has('alternate') // => false
  }
});
```

***Example - 2***
```javascript
const ast1 = {
  type: 'Program',
  sourceType: 'module',
  body: []
};

traverse(ast1, {
  Program(path) {
    path.has('body') // => false
    // Because the array is empty
  }
});

const ast2 = {
  type: 'Program',
  sourceType: 'module',
  body: [
    {
      type: 'EmptyStatement'
    }
  ]
};

traverse(ast2, {
  Program(path) {
    path.has('body') // => true
    // In this case the array is not empty
  }
});
```

### `is(key)`
- `key`: <`string`> The key to search for the value
- Returns: <`boolean`> If the value is truthy

Checks if the path _is_ something

```javascript
const ast = {
  type: 'ObjectExpression',
  properties: [
    {
      type: 'Property',
      key: {
        type: 'Identifier',
        name: 'x'
      },
      value: {
        type: 'Identifier',
        name: 'x'
      },
      kind: 'init',
      computed: false,
      method: false,
      shorthand: true
    }
  ]
};

traverse(ast, {
  Property(path) {
    if (path.node === ast.properties[0]) {
      path.is('shorthand') // => true
      path.is('method') // => false
    }
  }
});
```

<!--
                                                                         
 _|_|_|                                                              _|  
 _|    _|    _|_|    _|_|_|  _|_|      _|_|    _|      _|    _|_|_|  _|  
 _|_|_|    _|_|_|_|  _|    _|    _|  _|    _|  _|      _|  _|    _|  _|  
 _|    _|  _|        _|    _|    _|  _|    _|    _|  _|    _|    _|  _|  
 _|    _|    _|_|_|  _|    _|    _|    _|_|        _|        _|_|_|  _|  
                                                                         
                                                                         
-->

### `remove()`

Removes the node from the tree


### `replaceWith(node)`
- `node`: <`Node`> The node that the current node would be replace with
- Returns: <`NodePath`> The NodePath of the new node

Removes the old node and inserts the new node in the old node's position

```javascript
const ast = {
  type: 'AssignmentExpression',
  left: {
    type: 'Identifier',
    name: 'targetNode'
  },
  operator: '=',
  right: {
    type: 'Identifier',
    name: 'b'
  }
};

traverse(ast, {
  Identifier(path) {
    if (path.node.name === 'targetNode') {
      const newPath = path.replace({
        type: 'Identifier',
        name: 'a'
      });

      // `newPath` is the path for the new node
    }
  }
});

assert.deepEqual(ast, {
  type: 'AssignmentExpression',
  left: {
    type: 'Identifier',
    name: 'a'
  },
  operator: '=',
  right: {
    type: 'Identifier',
    name: 'b'
  }
});
```

### `replaceWithMultiple(nodes)`
- `nodes`: <`NodePath[]`> The nodes that the current node would be replace with
- Returns: <`NodePath[]`> The NodePaths of the new nodes

Removes the old node and inserts the new nodes in the old node's position

```javascript
const ast = {
  type: 'ArrayExpression',
  elements: [
    {
      type: 'Literal',
      value: 1
    },
    {
      type: 'Identifier',
      name: 'targetNode'
    },
    {
      type: 'Literal',
      value: 5
    }
  ]
};

traverse(ast, {
  Identifier(path) {
    if (path.node.name === 'targetNode') {
      const newPaths = path.replaceWithMultiple([
        {
          type: 'Literal',
          value: 2
        },
        {
          type: 'Literal',
          value: 3
        },
        {
          type: 'Literal',
          value: 4
        }
      ]);

      // `newPaths` are the paths for the new nodes
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
      type: 'Literal',
      value: 3
    },
    {
      type: 'Literal',
      value: 4
    },
    {
      type: 'Literal',
      value: 5
    }
  ]
});
```
