# NodePath

## Properties

### node

The node associated with the `NodePath`

### type

Type of the node that is associated the `NodePath`

### key

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

