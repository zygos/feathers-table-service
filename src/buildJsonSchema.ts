import { TableSchema } from './@types'

export default function buildJsonSchema(tableSchema: TableSchema) {
  for (const key in tableSchema.properties) {
    if (typeof tableSchema.properties[key] === 'function') {
      tableSchema.properties[key] = tableSchema.properties[key]()
    }
  }

  return tableSchema
}
