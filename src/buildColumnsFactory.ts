import { CaseFunction, TableSchemaProperties } from './@types'
import { isPlainObject } from './utils'

type CreateTableBuilder = any

export default function buildColumns(properties: TableSchemaProperties) {
  return (tableBuilder: CreateTableBuilder) => {
    Object.values(properties).forEach((property) => {
      const columnName = property.columnName
      const type = property.knexType || property.type
      const typeArgs = property.args || property.typeArgs || []
      const isAlter = property.doesExist

      if (isAlter && (property.unique || property.primary || property.references)) return

      const column = typeof tableBuilder[type] === 'function'
        ? tableBuilder[type](columnName, ...typeArgs)
        : tableBuilder.specificType(columnName, type)

      if (isAlter) {
        column.alter()
      } else {
        if (typeof property.primary === 'string') {
          column.primary(property.primary)
        } else if (property.primary) {
          column.primary()
        }
      }

      if (typeof property.default !== 'undefined' || typeof property.defaultTo !== 'undefined') {
        const defaultValue = typeof property.defaultTo === 'undefined'
          ? property.default
          : property.defaultTo

        if (!(typeof property.defaultTo === 'undefined' && 'defaultTo' in property)) {
          column.defaultTo(defaultValue)
        }
      }

      if (property.nullable === false) {
        column.notNullable()
      }

      if (property.comment) {
        column.comment(property.comment)
      }

      if (property.unsigned) {
        column.unsigned()
      }

      if (property.onDelete) {
        column.onDelete(property.onDelete)
      }

      if (property.onUpdate) {
        column.onUpdate(property.onUpdate)
      }
    })
  }
}
