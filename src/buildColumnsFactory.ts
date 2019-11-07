import Knex from 'knex'
import { TableFields } from './@types'

export default function buildColumnsFactory(safeCase: Function) {
  return function buildColumns(fields: TableFields) {
    return (tableBuilder: Knex.TableBuilder) => {
      for (const name in fields) {
        const columnName = safeCase(name)
        const entry = fields[name]
        const type = entry.type
        const typeArgs = entry.typeArgs || entry.args || []
        const column = typeof tableBuilder[type] === 'function'
          ? tableBuilder[type](columnName, ...typeArgs)
          : tableBuilder.specificType(columnName, type)

        if (entry.nullable === false) {
          column.notNullable()
        }

        if (entry.unique) {
          column.unique()
        }

        if (typeof entry.primary === 'string') {
          column.primary(entry.primary)
        } else if (entry.primary) {
          column.primary()
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

        if (typeof entry.defaultTo !== 'undefined') {
          column.defaultTo(entry.defaultTo)
        }
      }
    }
  }
}
