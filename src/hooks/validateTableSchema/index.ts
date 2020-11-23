import { HookContext } from '@feathersjs/feathers'
import { TableSchema, Validator } from '../../@types'
import validationsFactory from './validationsFactory'
import { Unprocessable } from '@feathersjs/errors'

export default function validateTableSchemaFactory(validator: Validator) {
  return (tableSchema: TableSchema) => {
    if (Object.prototype.hasOwnProperty.call(tableSchema, 'app')) {
      throw new Error('Hook called without a schema')
    }

    const validations = validationsFactory(tableSchema, validator)

    return function validateTableSchema(ctx: HookContext) {
      if (typeof ctx.data === 'undefined') return

      const validation = validations(ctx)

      if (validation !== true) {
        throw new Unprocessable('Invalid data', {
          errors: validation,
        })
      }
    }
  }
}
