import { TableFields, Validator, ValidateOptions } from '../../@types'
import { HookContext } from '@feathersjs/feathers'
import { castArray } from '../../utils'

export default function validationsFactory(
  fields: TableFields,
  validator: Validator,
  { inheritNullable }: ValidateOptions,
) {
  const buildValidations = (assignToValidations = {}) => {
    const validations: { [key: string]: any } = {}

    for (const key in fields) {
      const staticField = typeof fields[key] === 'function'
        ? fields[key]()
        : fields[key]

      if (staticField.validate) {
        validations[key] = {...staticField.validate }

        if (inheritNullable && staticField.nullable) {
          validations[key].nullable = staticField.nullable
        }
      }
    }

    return validations
  }

  const properties = buildValidations()

  const required = Object
    .keys(fields)
    .filter(fieldName => fields[fieldName].required)

  const requiredInputs = Object
    .keys(fields)
    .filter(fieldName => fields[fieldName].required)

  // for PATCH
  const checkWithoutRequired = validator.compile({ properties })

  // for CREATE, UPDATE user inputs
  const checkWithRequiredInputs = validator.compile({
    required: requiredInputs,
    properties,
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
