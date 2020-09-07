import { CaseFunction, Options, Table } from './@types'
import Knex from 'knex'
import buildColumnsFactory from './buildColumnsFactory'

export default function buildTableFactory(safeCase: CaseFunction, options: Options) {
  const buildColumns = buildColumnsFactory(safeCase)

  return async function buildTable(knex: Knex, table: Table) {
    const propertiesColumns = Object.fromEntries(Object
      .entries(table.schema.properties)
      .map(([propertyName, property]) => [safeCase(propertyName), property]))

    if (!await knex.schema.hasTable(table.name)) {
      return knex.schema
        .createTable(table.name, buildColumns(table.schema.properties))
        .then(() => Promise.resolve())
    }

    function toColumns(acc: { [key: string]: any }, [fieldName, doesExist]: [string, boolean]) {
      if (typeof fieldName === 'string') {
        acc[fieldName] = {
          ...propertiesColumns[fieldName],
          doesExist,
        }
      }

      return acc
    }

    const columnNames = Object.keys(propertiesColumns)

    const columnsStates: [string, boolean][] = await Promise.all(columnNames
      .map(columnName => knex.schema
        .hasColumn(table.name, columnName)
        .then(hasColumn => [columnName, hasColumn])))

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
      const columnsToDrop = Object
        .keys(columnInfo)
        .filter(columnName => !columnNames.includes(columnName))

      if (columnsToDrop.length) {
        await knex.schema.alterTable(table.name, (table) => {
          table.dropColumns(...columnsToDrop)
        })
      }
    }
  }
}
