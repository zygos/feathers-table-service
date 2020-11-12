import { CaseFunction, Options, Table } from './@types'
import Knex from 'knex'
import { constraintTypes, constraintTypesKeys } from './constraints'
import { capitalize, uncastArray } from './utils'

function hasNoMatchingConstraint(matchingIndexArr: any[][]) {
  return ([columnName, constraintTypeKey, constraint]: any) => {
    return !matchingIndexArr
      .some(([otherColumnName, otherConstraintTypeKey, otherConstraints]) => {
        return otherConstraints
          .some((otherConstraint: unknown) => {
            return constraintTypeKey === otherConstraintTypeKey &&
              constraintTypes[constraintTypeKey].isSame(constraint, otherConstraint)
          })
      })
  }
}

function flattenConstraints(constraintsNested: any[]) {
  return constraintsNested
    .flatMap(([columnName, constraintTypeKey, constraints]: [string, string, any]) => constraints
      .map((constraint: any) => [columnName, constraintTypeKey, constraint]))
}

export default function migrateIndexesFactory(safeCase: CaseFunction, options: Options) {
  return async function migrateIndexes(knex: Knex, table: Table) {
    // TODO: throw error on non postgres DB
    // TODO: migrate primary key
    // TODO: support withKeyName for indexes

    const indexes = await constraintTypes.index.getExisting(knex, table.name)
    const references = await constraintTypes.references.getExisting(knex, table.name)
    const constraintsExisting = [...indexes, ...references]
    const constraintsWanted = Object
      .entries(table.schema.properties)
      .filter(([_, field]) => constraintTypesKeys
        .some(constraintTypeKey => !!field[constraintTypeKey]))
      .map(([key, field]) => [safeCase(key), field])
      .flatMap(([columnName, field]) => constraintTypesKeys
        .filter(constraintTypeKey => field[constraintTypeKey])
        .map((constraintTypeKey) => {
          const constraintType = constraintTypes[constraintTypeKey]
          const constraintSchema = field[constraintTypeKey]
          const isArray = Array.isArray(constraintSchema)

          if (isArray && !constraintSchema.length) {
            throw new Error('Database constraint array can not be empty')
          }

          const constraintsSchemaArray = (isArray &&
            constraintSchema.some((schema: unknown) => typeof schema !== 'string'))
            ? constraintSchema
            : [constraintSchema]

          const constraints = constraintsSchemaArray
            .map((constraintSchemaItem: unknown) => constraintType
              .format(table.name, columnName, constraintSchemaItem, field, safeCase))

          return [columnName, constraintTypeKey, constraints]
        }))
      .filter(index => !!index)

    if (!constraintsExisting.length && !constraintsWanted.length) return

    const constraintsAdd: any[] = flattenConstraints(constraintsWanted)
      .filter(hasNoMatchingConstraint(constraintsExisting))
    const constraintsDrop: any[] = flattenConstraints(constraintsExisting)
      .filter(hasNoMatchingConstraint(constraintsWanted))

    if (constraintsDrop.length) {
      await knex.schema.alterTable(table.name, (tableBuilder: Knex.TableBuilder) => {
        constraintsDrop.forEach(([columnName, constraintTypeKey, constraint]) => {
          const dropKey = constraintTypes[constraintTypeKey].dropKey ||
            `drop${capitalize(constraintTypeKey)}`

          tableBuilder[`${dropKey}`](null, constraint.name)
        })
      })
    }

    if (constraintsAdd.length) {
      await knex.schema.alterTable(table.name, (tableBuilder: Knex.TableBuilder) => {
        constraintsAdd.forEach(([columnName, constraintType, constraint]) => {
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
