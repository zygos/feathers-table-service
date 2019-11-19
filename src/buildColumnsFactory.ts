import Knex from 'knex'
import { TableSchemaProperties } from './@types'

export default function buildColumnsFactory(safeCase: Function) {
  return function buildColumns(properties: TableSchemaProperties) {
    return (tableBuilder: Knex.TableBuilder) => {
      Object.keys(properties).forEach((name) => {
        const columnName = safeCase(name)
        const entry = properties[name]
        const type = entry.knexType || entry.type
        const typeArgs = entry.args || entry.typeArgs || []
        const isAlter = entry.doesExist

        if (isAlter && (entry.unique || entry.primary || entry.references)) return

        const column = typeof tableBuilder[type] === 'function'
          ? tableBuilder[type](columnName, ...typeArgs)
          : tableBuilder.specificType(columnName, type)

        if (isAlter) {
          column.alter()
        }

        if (entry.unique) {
          column.unique()
        }

        if (typeof entry.primary === 'string') {
          column.primary(entry.primary)
        } else if (entry.primary) {
          column.primary()
        }

        if (entry.nullable === false) {
          column.notNullable()
        }

        if (entry.comment) {
          column.comment(entry.comment)
        }

        if (entry.unsigned) {
          column.unsigned()
        }

        if (entry.references) {
          column.references(entry.references)
        }
        if (entry.inTable) {
          column.inTable(entry.inTable)
        }

        if (entry.onDelete) {
          column.onDelete(entry.onDelete)
        }

        if (entry.onUpdate) {
          column.onUpdate(entry.onUpdate)
        }

        if (typeof entry.default !== 'undefined' || typeof entry.defaultTo !== 'undefined') {
          const defaultValue = typeof entry.defaultTo === 'undefined'
            ? entry.default
            : entry.defaultTo

          if (!(typeof entry.defaultTo === 'undefined' &&
            Object.keys(entry).includes('defaultTo'))) {
            column.defaultTo(defaultValue)
          }
        }
      })
    }
  }
}
