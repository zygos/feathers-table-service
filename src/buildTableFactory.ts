import { CaseFunction, Options, Table } from './@types'
import Knex from 'knex'
import buildColumnsFactory from './buildColumnsFactory'

export default function buildTableFactory(safeCase: CaseFunction, options: Options) {
  const buildColumns = buildColumnsFactory(safeCase)

  return async function buildTable(knex: Knex, table: Table) {
    if (!await knex.schema.hasTable(table.name)) {
      return knex.schema
        .createTable(table.name, buildColumns(table.schema.properties))
        .then(() => Promise.resolve())
    }

    function toColumns(acc: { [key: string]: any }, [fieldName, doesExist]: [string, boolean]) {
      if (typeof fieldName === 'string') {
        acc[fieldName] = {
          ...table.schema.properties[fieldName],
          doesExist,
        }
      }

      return acc
    }

    const columnsStates: [string, boolean][] = await Promise.all(Object
      .keys(table.schema.properties)
      .map(fieldName => knex.schema
        .hasColumn(table.name, safeCase(fieldName))
        .then((hasColumn: boolean) => [fieldName, hasColumn] as [string, boolean])))

    if (options.doAlterColumns) {
      const columnsToAlter = columnsStates
        .filter(([_, doesExist]) => doesExist && options.doAlterColumns)
        .reduce(toColumns, <{ [key: string]: any }>{})

      await knex.schema.alterTable(table.name, buildColumns(columnsToAlter))
    }

    if (options.doAddColumns) {
      const columnsToBuild = columnsStates
        .filter(([_, doesExist]) => !doesExist && options.doAddColumns)
        .reduce(toColumns, <{ [key: string]: any }>{})

      await knex.schema.table(table.name, buildColumns(columnsToBuild))
    }

    if (options.doDropColumns) {
      const columnInfo = await knex(table.name).columnInfo()
      const fieldsInSchema = Object.keys(table.schema.properties)
      const columnsToDrop = Object
        .keys(columnInfo)
        .filter(columnName => !fieldsInSchema.includes(columnName))

      if (columnsToDrop.length) {
        await knex.schema.alterTable(table.name, (table: Knex.TableBuilder) => {
          table.dropColumns(...columnsToDrop)
        })
      }
    }
  }
}
