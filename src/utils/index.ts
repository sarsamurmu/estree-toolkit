export { evaluate, evaluateTruthy } from './evaluate'
export { hasBinding } from './hasBinding'

import { NodePath } from '../nodepath'

export const getCommonAncestor = (paths: NodePath[]): NodePath | null => {
  const ancestorsArr = []
  for (let i = 0; i < paths.length; i++) {
    const ancestors = []
    let parent = paths[i].parentPath
    while (parent != null) {
      ancestors.push(parent)
      parent = parent.parentPath
    }
    ancestorsArr.push(ancestors.reverse())
  }

  let common = null
  let currAncestor
  for (let i = 0;; i++) {
    currAncestor = ancestorsArr[0][i]
    for (let j = 0; j < paths.length; j++) {
      if (currAncestor !== ancestorsArr[j][i]) return common
    }
    common = currAncestor
  }
}
