// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

/** This interface documents each field of a NodePath. */
export interface NodePathDocs {
  /** The node associated with the current path */
  node;
  /** Type of the node that is associated with this path */
  type;
  /**
    The current node's key in its parent
   
    ___Example___
    ```
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
   */
  key;
  /**
    If this node is part of an array, `listKey` would be the key of the array in its parent
    
    ___Example___
    ```
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
   */
  listKey;
  /** If the node has been removed from its parent */
  removed;
  /** The parent path of the current path */
  parentPath;
  /** The parent node of the current path */
  parent;
  /**
    Container of the node
    
    ___Example 1___ - In this case `container` is an array
    ```
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
    
    ___Example 2___ - In this case `container` is a node object
    ```
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
   */
  container;

  /** Clone the node associated with the current nodepath */
  cloneNode;

  //#region Traversal

  /**
    Skip the path from traversal

    ___Example___
    ```
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
   */
  skip;
  /** Skip all children. Note: Grandchildren are not skipped */
  skipChildren;
  /**
    Un-skip the path from traversal. Whenever un-skipped, the path would be
    traversed if it's not already traversed
   */
  unSkip;
  /** Alias of `unSkip` */
  unskip;
  /** Un-skip all children. Opposite of skipChildren */
  unSkipChildren;
  /** Alias of `unSkipChildren` */
  unskipChildren;
  /** Traverse this path and its children with the given `visitor` and `state` */
  traverse;

  //#endregion

  //#region Ancestry

  /**
    Starting at the parent path of this path and going up the tree,
    returns first parent path where `predicate` is true
   
    ___Example___
    ```
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
   */
  findParent;
  /**
    Starting from **this** path and going up the tree,
    returns the first path where `predicate` is true
    
    ___Example___
    ```
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
   */
  find;
  /** Get the closest function parent */
  getFunctionParent;
  /** Get all the ancestors. Returns an array. __THIS NODE IS INCLUDED__ */
  getAncestry;
  /** Checks if the path is ancestor of the given path */
  isAncestorOf;
  /** Checks if the path is descendant of the given path */
  isDescendantOf;

  //#endregion

  //#region Modification

  /**
    Inserts the `nodes` before the current node

    ___Example___
    ```
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
   */
  insertBefore;
  /**
    Inserts the `nodes` after the current node

    ___Example___
    ```
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
   */
  insertAfter;
  /**
    Inserts child nodes at the start of the container

    ___Example___
    ```
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
   */
  unshiftContainer;
  /**
    Inserts the child nodes at the end of the container

    ___Example___
    ```
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
   */
  pushContainer;

  //#endregion

  //#region Family

  /**
    Get the children's path for which the key is `key`

    ___Example___
    ```
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
   */
  get;
  /**
    Get the path of its sibling for which the key is `key`

    ___Example___
    ```
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
   */
  getSibling;
  /**
    Get the opposite path of the current path

    ___Example___
    ```
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
   */
  getOpposite;
  /**
    The the previous sibling's path of the current path

    ___Example___
    ```
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
   */
  getPrevSibling;
  /**
    The the next sibling's path of the current path

    ___Example___
    ```
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
   */
  getNextSibling;
  /**
    Get all previous siblings' path of the current path\
    __NOTE__: Returned paths are reversed (they are sorted in how close
    they are to the current path, see example)

    ___Example___
    ```
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
   */
  getAllPrevSiblings;
  /**
    Get all next siblings' path of the current path

    ___Example___
    ```
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
   */
  getAllNextSiblings;

  //#endregion

  //#region Introspection

  /**
    Checks if the path has the specific property.
    If value of the property is an array, checks if the array is not empty.

    ___Example - 1___
    ```
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

    ___Example - 2___
    ```
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
   */
  has;
  /**
    Checks if path _is_ something

    ___Example___
    ```
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
   */
  is;

  //#endregion

  //#region Removal

  /** Removes the path from its parent */
  remove;

  //#endregion

  //#region Replacement
  
  /**
    Removes the old node and inserts the new node in the old node's position

    ___Example___
    ```
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
   */
  replaceWith;
  /**
    Removes the old node and inserts the new nodes in the old node's position

    ___Example___
    ```
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
   */
  replaceWithMultiple;

  //#endregion
}
