import { Indexes, Options, Table } from './@types'
import Knex from 'knex'

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const hasNoMatchingIndex = (matchingIndexArr: string[][]) =>
  ([columnName, constraint]: string[]) => !matchingIndexArr
    .some(([matchingColumnName, matchingConstraint]) =>
      columnName === matchingColumnName && constraint === matchingConstraint)

export default function migrateIndexesFactory(safeCase: Function, options: Options) {
  return async function migrateIndexes(knex: Knex, table: Table) {
    // TODO: throw error on non postgres DB
    // TODO: migrate primary key
    // TODO: support withKeyName for indexes

    const indexes = (await knex.raw(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = ?;`, table.name))
      .rows
      .filter((index: any) => !index.indexname.endsWith('_pkey'))

    const foreigns = (await knex.raw(`
      SELECT constraint_name AS indexname
      FROM information_schema.table_constraints
      WHERE
        constraint_type = 'FOREIGN KEY'
        AND table_schema = 'public'
        AND table_name = ?;`, table.name))
      .rows

    const constraints = [
      ...indexes,
      ...foreigns,
    ]

    if (!constraints.length) return

    const existingIndexes = constraints
      .map(index => index.indexname)
      .map(indexName => indexName.replace(`${table.name}_`, ''))
      .map(indexName => indexName.split('_'))
      .map(indexSplit => [indexSplit.slice(0, -1).join('_'), indexSplit.slice(-1)[0]])

    const constraintTypes = ['foreign', 'unique', 'index']
    const wantedIndexes = Object
      .entries(table.schema.properties)
      .filter(([_, field]) => constraintTypes.some(constraintType => !!field[constraintType]))
      .map(([key, field]) => [safeCase(key), field])
      .flatMap(([columnName, field]) => constraintTypes
        .filter(constraintType => field[constraintType])
        .map(constraintType => [columnName, constraintType, field]))
      .filter(index => !!index)

    const addIndexes = wantedIndexes.filter(hasNoMatchingIndex(existingIndexes))
    const dropIndexes = existingIndexes.filter(hasNoMatchingIndex(wantedIndexes))

    if (dropIndexes.length) {
      await knex.schema.alterTable(table.name, (tableBuilder: Knex.TableBuilder) => {
        dropIndexes.forEach(([columnName, constraintType]) => {
          tableBuilder[`drop${capitalize(constraintType)}`](columnName)
        })
      })
    }

    if (addIndexes.length) {
      await knex.schema.alterTable(table.name, (tableBuilder: Knex.TableBuilder) => {
        addIndexes.forEach(([columnName, constraintType, field]) => {
          const addIndex = tableBuilder[constraintType](columnName)

          if (constraintType === 'foreign') {
            const referenceIndex = addIndex.references(safeCase(field.references))
            const inTableIndex = field.inTable
              ? referenceIndex.inTable(safeCase(field.inTable))
              : referenceIndex

            ;['onDelete', 'onUpdate']
              .filter(cascadeEvent => field[cascadeEvent])
              .forEach(cascadeEvent => inTableIndex[cascadeEvent](field[cascadeEvent]))
          }
        })
      })
    }
  }
}
