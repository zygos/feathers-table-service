import { TableSchema, Validator } from '../../@types'
import { HookContext } from '@feathersjs/feathers'
import { castArray } from '../../utils'
import buildJsonSchema from '../../buildJsonSchema'

export default function validationsFactory(tableSchema: TableSchema, validator: Validator) {
  const { properties, required } = buildJsonSchema(tableSchema)

  // for PATCH
  const checkWithoutRequired = validator.compile({
    properties,
  })

  // for CREATE, UPDATE
  const checkWithRequired = validator.compile({
    properties,
    required,
  })

  return function validation(ctx: HookContext) {
    const check = ctx.method === 'patch'
      ? checkWithoutRequired
      : checkWithRequired

    for (const row of castArray(ctx.data)) {
      const validationResult = check(row)
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
