import { HookContext } from '@feathersjs/feathers'
import { TableFields, Validator, ValidateOptions } from '../../@types'
import transformsFactory from './transformsFactory'
import validationsFactory from './validationsFactory'
import { BadRequest } from '@feathersjs/errors'

export default function validateTableSchemaFactory(
  validator: Validator,
  options: ValidateOptions = { inheritNullable: false },
) {
    return (fieldsList: TableFields) => {
      if (fieldsList.app && fieldsList.method) {
        throw new Error('Hook called without a schema')
      }

      const validations = validationsFactory(fieldsList, validator, options)
      const transforms = transformsFactory(fieldsList)

      return function validateTableSchema(ctx: HookContext) {
        if (typeof ctx.data === 'undefined') return ctx

        const validation = validations(ctx)
        if (validation !== true) {
          throw new BadRequest('Invalid data', {
            errors: validation,
          })
        }

        transforms(ctx)

        return ctx
      }
    }
  }
