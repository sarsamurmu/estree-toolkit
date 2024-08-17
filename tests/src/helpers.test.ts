import { definitions } from '<project>/definitions'
import { aliases } from '<project>/aliases'
import { toCamelCase } from '<project>/helpers'

describe('string to camel case', () => {
  test('node names', () => {
    const nodeNames = Object.keys(definitions)
    expect(nodeNames.map(toCamelCase).join('\n')).toMatchSnapshot()
  })

  test('alias names', () => {
    const aliasNames = Object.keys(aliases)
    expect(aliasNames.map(toCamelCase).join('\n')).toMatchSnapshot()
  })
})
