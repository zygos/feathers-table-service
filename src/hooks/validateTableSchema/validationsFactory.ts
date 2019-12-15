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
    const doIgnoreRequired = (ctx.params && ctx.params.tableService)
      ? ctx.params.tableService.doIgnoreRequired
      : undefined

    const doUseRequired = typeof doIgnoreRequired === 'undefined'
      ? ctx.method !== 'patch'
      : !doIgnoreRequired

    const check = doUseRequired
      ? checkWithRequired
      : checkWithoutRequired

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
