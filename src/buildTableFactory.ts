import Knex from 'knex'
import buildColumnsFactory from './buildColumnsFactory'
import { Table } from './@types'

// TODO: add column dropping
export default function buildTableFactory(safeCase: Function) {
  const buildColumns = buildColumnsFactory(safeCase)

  return async function buildTable(knex: Knex, table: Table) {
    if (!await knex.schema.hasTable(table.name)) {
      return knex.schema
        // .createTableIfNotExists(table.name, buildColumns(table.fields))
        .createTable(table.name, buildColumns(table.fields))
        .then(() => {
          return Promise.resolve()
        })
    }

    // add previously non existant columns
    const nonExistantColumns = (await Promise.all(Object
      .keys(table.fields)
      .map(fieldName => knex.schema
          .hasColumn(table.name, safeCase(fieldName))
          .then(hasColumn => hasColumn ? null : fieldName))))
        .filter(fieldName => fieldName)
        .reduce((acc, key) => {
          if (typeof key === 'string') {
            acc[key] = table.fields[key]
          }
          return acc
        }, <{ [key: string]: any }>{})


    return knex.schema
      .table(table.name, buildColumns(nonExistantColumns))
  }
}
