import { Builders } from './generated/builders-type'
import { definitions, Definition, Definitions, DefinitionField, getFieldsOf } from './definitions'
import { runValidation } from './assert'
import { toCamelCase } from './helpers'

let shouldValidateNodes = true

export const setNodeValidationEnabled = (state: boolean) => {
  shouldValidateNodes = state
}

export const getNodeValidationEnabled = () => shouldValidateNodes

export const builders: Builders = {} as any

// Pseudo type for some kind of value, actual value may not like this type
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Some extends Record<string, Record<string, unknown>> {}

for (const key in definitions) {
  const nodeType = key as keyof Definitions

  const definition: Definition = (definitions as any)[nodeType]
  const { fields } = definition
  const fieldNames = getFieldsOf(definition, 'builder');

  (builders as any)[toCamelCase(nodeType)] = (...args: any[]) => {
    const node: Record<string, unknown> = { type: nodeType }

    fieldNames.forEach((fieldName, index) => {
      const field = (fields as Record<string, DefinitionField<Some, Some>>)[fieldName]

      node[fieldName] = args[index] !== undefined ? args[index] : (
        'default' in field
          ? (
            typeof field.default == 'function'
              ? field.default(node as Some)
              : field.default
          )
          : /* istanbul ignore next */ args[index]
      )

      if (shouldValidateNodes && field.validate != null) {
        runValidation(field.validate, node[fieldName])
      }
    })

    if (shouldValidateNodes && definition.finalValidate != null) {
      runValidation(definition.finalValidate, node)
    }

    return node
  }
}
