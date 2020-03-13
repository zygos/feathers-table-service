import { Options, Table } from './@types'
import Knex from 'knex'
import { constraintTypes, constraintTypesKeys } from './constraints'
import { capitalize, uncastArray } from './utils'

function hasNoMatchingConstraint(matchingIndexArr: string[][]) {
  return ([columnName, constraintTypeKey, constraint]: string[]) => {
    return !matchingIndexArr
      .some(([anotherColumnName, anotherConstraintTypeKey, anotherConstraint]) => {
        return constraintTypeKey === anotherConstraintTypeKey &&
          constraintTypes[constraintTypeKey].isSame(constraint, anotherConstraint)
      })
  }
}

export default function migrateIndexesFactory(safeCase: Function, options: Options) {
  return async function migrateIndexes(knex: Knex, table: Table) {
    // TODO: throw error on non postgres DB
    // TODO: migrate primary key
    // TODO: support withKeyName for indexes

    const indexes = await constraintTypes.index.getExisting(knex, table.name)
    const references = await constraintTypes.references.getExisting(knex, table.name)
    const existingConstraints = [...indexes, ...references]
    const wantedConstraints = Object
      .entries(table.schema.properties)
      .filter(([_, field]) => constraintTypesKeys
        .some(constraintTypeKey => !!field[constraintTypeKey]))
      .map(([key, field]) => [safeCase(key), field])
      .flatMap(([columnName, field]) => constraintTypesKeys
        .filter(constraintTypeKey => field[constraintTypeKey])
        .map((constraintTypeKey) => {
          const constraintType = constraintTypes[constraintTypeKey]
          const constraint = constraintType
            .format(table.name, columnName, field[constraintTypeKey], field, safeCase)

          return [columnName, constraintTypeKey, constraint]
        }))
      .filter(index => !!index)

    if (!existingConstraints.length && !wantedConstraints.length) return

    const addConstraints: any[] = wantedConstraints
      .filter(hasNoMatchingConstraint(existingConstraints))
    const dropConstraints: any[] = existingConstraints
      .filter(hasNoMatchingConstraint(wantedConstraints))

    if (dropConstraints.length) {
      await knex.schema.alterTable(table.name, (tableBuilder: Knex.TableBuilder) => {
        dropConstraints.forEach(([columnName, constraintTypeKey, constraint]) => {
          const dropKey = constraintTypes[constraintTypeKey].dropKey ||
            `drop${capitalize(constraintTypeKey)}`

          tableBuilder[`${dropKey}`](null, constraint.name)
        })
      })
    }

    if (addConstraints.length) {
      await knex.schema.alterTable(table.name, (tableBuilder: Knex.TableBuilder) => {
        addConstraints.forEach(([columnName, constraintType, constraint]) => {
          const columnsArgument = uncastArray(constraint.columns)

          if (constraintType === 'references') {
            const referencesArgument = uncastArray(constraint.references)
            const reference: any = tableBuilder
              .foreign(columnsArgument, constraint.name)
              .references(referencesArgument)

            ;['onDelete', 'onUpdate']
              .filter(cascadeEvent => constraint[cascadeEvent])
              .forEach(cascadeEvent => reference[cascadeEvent](constraint[cascadeEvent]))
          } else if (constraintType === 'unique') {
            tableBuilder.unique(columnsArgument, constraint.name)
          } else if (constraintType === 'index') {
            tableBuilder.index(columnsArgument, constraint.name, constraint.type)
          }
        })
      })
    }
  }
}
