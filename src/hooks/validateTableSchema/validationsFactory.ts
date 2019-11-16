import { TableFields, Validator, ValidateOptions } from '../../@types'
import { HookContext } from '@feathersjs/feathers'
import { castArray } from '../../utils'
import buildJsonSchema from '../../buildJsonSchema'

export default function validationsFactory(
  fields: TableFields,
  validator: Validator,
  options: ValidateOptions,
) {
  const { properties, required } = buildJsonSchema(fields, options)

  const requiredInputs = Object
    .keys(fields)
    .filter(fieldName => fields[fieldName].required)

  // for PATCH
  const checkWithoutRequired = validator.compile({
    properties,
  })

  // for CREATE, UPDATE user inputs
  const checkWithRequiredInputs = validator.compile({
    properties,
    required: requiredInputs,
  })

  // for CREATE, UPDATE processed inputs
  const checkWithRequired = validator.compile({
    properties,
    required,
  })

  return function validation(ctx: HookContext) {
    const isUserInput = (ctx.params || {}).validateInput
    const check = ctx.method === 'patch'
      ? checkWithoutRequired
      : isUserInput
        ? checkWithRequiredInputs
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
