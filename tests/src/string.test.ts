import { definitions } from '<project>/definitions'
import { aliases } from '<project>/aliases'
import { toCamelCase } from '<project>/string'

const nodeNames = Object.keys(definitions)
const aliasNames = Object.keys(aliases)

describe('string to camel case', () => {
  test('node names', () => {
    expect(nodeNames.map(toCamelCase).join('\n')).toMatchSnapshot()
  })

  test('alias names', () => {
    expect(aliasNames.map(toCamelCase).join('\n')).toMatchSnapshot()
  })
})
