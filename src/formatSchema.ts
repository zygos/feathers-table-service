import { TableSchema } from './@types'
import { maybeCall } from './utils'


const defaultField = {
  comment: null,
  foreign: null,
  index: false,
  nullable: true,
  onDelete: null,
  onUpdate: null,
  type: 'string',
  transform: undefined,
  transformForce: false,
  primary: false,
  references: null,
  unique: false,
}

export default function formatSchema(schema: TableSchema): TableSchema {
  if (!schema) throw new Error('No table schema provided')

  for (const columnName in schema.properties) {
    const field = maybeCall(schema.properties[columnName])
    schema.properties[columnName] = {
      ...defaultField,
      ...field,
    }

    if (field.references) {
      schema.properties[columnName].foreign = true
    }
  }

  return schema
}