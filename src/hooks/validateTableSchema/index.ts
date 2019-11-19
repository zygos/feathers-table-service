import { HookContext } from '@feathersjs/feathers'
import { TableSchema, Validator } from '../../@types'
import transformsFactory from './transformsFactory'
import validationsFactory from './validationsFactory'
import { BadRequest } from '@feathersjs/errors'

export default function validateTableSchemaFactory(
  validator: Validator,
) {
    return (tableSchema: TableSchema) => {
      if (typeof tableSchema.app !== 'undefined') {
        throw new Error('Hook called without a schema')
      }

      const validations = validationsFactory(tableSchema, validator)
      const transforms = transformsFactory(tableSchema.properties)

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
