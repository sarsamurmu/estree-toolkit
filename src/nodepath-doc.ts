// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

/** This interface documents each field of a NodePath. */
export interface NodePathDocs {
  /** The node associated with the current NodePath */
  node
  /** Type of the node that is associated with this NodePath */
  type
  /**
   * The current node's key in its parent
   *
   * Example
   * ```
   * const ast = {
   *   type: 'IfStatement',
   *   test: {
   *     type: 'Identifier',
   *     name: 'targetNode'
   *   },
   *   consequent: {
   *     type: 'EmptyStatement'
   *   },
   *   alternate: null
   * };
   *
   * traverse(ast, {
   *   Identifier(path) {
   *     if (path.node.name === 'targetNode') {
   *       path.key === 'test' // => true
   *     }
   *   }
   * });
   * ```
   */
  key
  /**
   * If this node is part of an array, `listKey` is the key of the array in its parent
   * 
   * Example
   * ```
   * const ast = {
   *   type: 'ArrayExpression',
   *   elements: [
   *     {
   *       type: 'Identifier',
   *       name: 'targetNode'
   *     }
   *   ]
   * };
   * 
   * traverse(ast, {
   *   Identifier(path) {
   *     if (path.node.name === 'targetNode') {
   *       path.listKey === 'elements' // => true
   *       path.key === 0 // => true
   *     }
   *   }
   * });
   * ```
   */
  listKey
  /** If the node has been removed from its parent */
  removed
  /** The parent path of the current NodePath */
  parentPath
  /** The parent node of the current NodePath */
  parent
  /**
   * Container of the node
   * 
   * Example - 1
   * ```
   * const ast = {
   *   type: 'ArrayExpression',
   *   elements: [
   *     {
   *       type: 'Identifier',
   *       name: 'targetNode'
   *     }
   *   ]
   * };
   * 
   * traverse(ast, {
   *   Identifier(path) {
   *     if (path.node.name === 'targetNode') {
   *       path.container === ast.elements // => true
   *     }
   *   }
   * });
   * ```
   * 
   * Example - 2
   * ```
   * const ast = {
   *   type: 'IfStatement',
   *   test: {
   *     type: 'Identifier',
   *     name: 'targetNode'
   *   },
   *   consequent: {
   *     type: 'EmptyStatement'
   *   },
   *   alternate: null
   * };
   * 
   * traverse(ast, {
   *   Identifier(path) {
   *     if (path.node.name === 'targetNode') {
   *       path.container === ast // => true
   *     }
   *   }
   * });
   * ```
   */
  container

  //#region Traversal

  skip
  traverse

  //#endregion

  //#region Ancestry

  /**
   * Starting at the parent path of this `NodePath` and going up the tree,
   * returns first parent path where `predicate` is true
   *
   * Example
   * ```
   * const ast = {
   *   type: 'BlockStatement',
   *   body: [
   *     {
   *       type: 'BlockStatement',
   *       body: [
   *         {
   *           type: 'ExpressionStatement',
   *           expression: {
   *             type: 'Literal',
   *             value: 0
   *           }
   *         }
   *       ]
   *     }
   *   ]
   * };
   *
   * traverse(ast, {
   *   Literal(path) {
   *     const blockParent = path.findParent(
   *       (parent) => parent.type === 'BlockStatement'
   *     ).node;
   *     blockParent === ast.body[0] // => true, Notice how it is not `ast` and is `ast.body[0]`
   *   }
   * });
   * ```
   */
  findParent
  /**
   * Starting from **this** `NodePath` and going up the tree,
   * returns the first `NodePath` where `predicate` is true
   * 
   * Example
   * ```
   * const ast = {
   *   type: 'ExpressionStatement',
   *   expression: {
   *     type: 'Literal',
   *     value: 0
   *   }
   * };
   * 
   * traverse(ast, {
   *   Literal(path) {
   *     path.find((p) => p.type === 'Literal').node === ast.expression // => true
   *     path.find((p) => p.type === 'ExpressionStatement').node === ast // => true
   *   }
   * });
   * ```
   */
  find
  /** Get the closest function parent */
  getFunctionParent

  //#endregion

  //#region Modification

  /** Inserts the `nodes` before the current node */
  insertBefore
  /** Inserts the `nodes` after the current node */
  insertAfter
  /** Insert child nodes at the start of the container */
  unshiftContainer
  /** Insert the child nodes at the end of the container */
  pushContainer

  //#endregion

  //#region Family

  /** Get the children NodePath for which the key is `key` */
  get
  /** Get the NodePath of its sibling for which the key is `key` */
  getSibling
  /** Get the opposite NodePath */
  getOpposite
  /** The the previous sibling of the current node */
  getPrevSibling
  /** The the next sibling of the current node */
  getNextSibling
  /** Get all previous siblings of the current node */
  getAllPrevSiblings
  /** Get all next siblings of the current node */
  getAllNextSiblings

  //#endregion

  //#region Introspection

  has
  is

  //#endregion

  //#region Removal

  /** Remove the node from its parent */
  remove

  //#endregion

  //#region Replacement
  
  /** Removes the old node and inserts the new node in the old node's position */
  replaceWith
  /** Removes the old node and inserts the new nodes in the old node's position */
  replaceWithMultiple

  //#endregion
}
