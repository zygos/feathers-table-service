import { TableSchema, Validator } from '../../@types'
import { HookContext } from '@feathersjs/feathers'
import { castArray } from '../../utils'
import buildJsonSchema from '../../buildJsonSchema'

export default function validationsFactory(tableSchema: TableSchema, validator: Validator) {
  const { properties, required } = buildJsonSchema(tableSchema)

  const check = validator.compile({
    properties,
    required,
  })

  return function validation(ctx: HookContext) {
    for (const record of castArray(ctx.data)) {
      const validationResult = check(record)
      if (validationResult !== true) {
        if (typeof validationResult !== 'boolean') {
          return validationResult
        } else if (check.errors) {
          return check.errors
        }

        return [new Error('Validation failed')]
      }
    }

    return true
  }
}
