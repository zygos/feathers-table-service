import { CaseFunction, ColumnInfo, Options, Table, TableSchemaProperties } from './@types'
import { Knex } from 'knex'
import { TABLE_SERVICE_SCHEMAS } from './consts'
import { filter, map, omit, prop, propEq } from 'rambda'
import buildColumns from './buildColumnsFactory'

interface ColumnInfoExistance extends ColumnInfo {
  columnName: string
  doesExist: boolean
}

export default function buildTableFactory(safeCase: CaseFunction, options: Options) {
  return async function buildTable(
    knex: Knex,
    tableColumns: ColumnInfo[],
    propertiesPrevious: TableSchemaProperties,
    table: Table,
  ) {
    const properties: TableSchemaProperties = Object.fromEntries(Object
      .entries(table.schema.properties)
      .map(([fieldName, property]) => {
        const columnName = safeCase(fieldName)

        const propertyExtended = {
          ...property,
          columnName,
          doesExist: tableColumns?.some(propEq('columnName', columnName)) || false,
        }

        return [
          fieldName,
          {
            ...propertyExtended,
            _static: toStaticSchema(propertyExtended),
          },
        ]
      }))

    if (!await knex.schema.hasTable(table.name)) {
      return knex.schema
        .createTable(table.name, buildColumns(properties))
    }

    const propertiesStaticsToUpdate: TableSchemaProperties = await (async() => {
      return {
        ...await (async() => {
          if (!options.doAlterColumns) return {}

          const propertiesToAlter = Object.fromEntries(Object
            .entries(properties)
            .filter(([_, property]) => property.doesExist === true)
            .flatMap(([propertyKey, propertyCurrent]) => {
              const diff = getDifference(
                propertiesPrevious[propertyKey] || {},
                propertyCurrent._static || {},
              )

              if (!Object.keys(diff).length) return []

              return [
                [propertyKey, propertyCurrent._static],
              ]
            }))

          if (!Object.keys(propertiesToAlter).length) return {}

          // TODO: alter columns only based on diff
          await knex.schema.alterTable(table.name, buildColumns(propertiesToAlter))

          return propertiesToAlter
        })(),
        ...await (async() => {
          if (!options.doAddColumns) return {}

          const propertiesToAdd = filter(property => property.doesExist === false, properties)

          if (!Object.keys(propertiesToAdd).length) return {}

          const propertiesToAddStatic = map(prop('_static'), propertiesToAdd)

          await knex.schema.table(table.name, buildColumns(propertiesToAddStatic))

          return propertiesToAddStatic
        })(),
      }
    })()

    const propertiesKeysRemoved: string[] = await (async() => {
      if (!options.doDropColumns) return []

      const columnNames: string[] = Object
        .values(properties)
        .map(property => property.columnName)

      const columnNamesToDrop = tableColumns
        .map(prop('columnName'))
        .filter(columnName => !columnNames.includes(columnName))

      if (!columnNamesToDrop.length) return []

      await knex.schema.alterTable(table.name, (table: Knex.TableBuilder) => {
        table.dropColumns(...columnNamesToDrop)
      })

      return columnNamesToDrop
        .flatMap((columnName) => {
          const property = Object
            .entries(propertiesPrevious)
            .find(([_, property]) => property.columnName === columnName)

          if (!property) return []

          return [property[0]]
        })
    })()

    if (Object.keys(propertiesStaticsToUpdate).length > 0 || propertiesKeysRemoved.length) {
      const propertiesPreviousToMerge = omit(propertiesKeysRemoved, propertiesPrevious)
      // TODO: upsert update all at the same time
      // TODO: update only altered/added/dropped columns
      // TODO: only update if something has changed
      await knex(TABLE_SERVICE_SCHEMAS)
        .insert({
          table_name: table.name,
          properties: JSON.stringify({
            ...propertiesPreviousToMerge,
            ...propertiesStaticsToUpdate,
          }),
        })
        .onConflict('table_name')
        .merge()
    }
  }
}

const getDifference = (() => {
  const { equals } = require('rambda')

  return (original: Record<string, unknown>, incoming: Record<string, unknown>) => {
    const keysIncoming = Object.keys(incoming)
    const diffIncomingKeys = keysIncoming
      .filter(key => !equals(original[key], incoming[key]))

    const diffOriginal = Object
      .entries(original)
      .filter(([key]) => !keysIncoming.includes(key))

    const diffIncoming = diffIncomingKeys
      .map(key => [key, incoming[key]])

    return Object.fromEntries([
      ...diffIncoming,
      ...diffOriginal,
    ])
  }
})()

const toStaticSchema = (() => {
  const keysToKeep = new Set([
    'args',
    'columnName',
    'comment',
    'default',
    'defaultTo',
    'doesExist',
    'knexType',
    'nullable',
    'onDelete',
    'onUpdate',
    'primary',
    'references',
    'type',
    'typeArgs',
    'unique',
    'unsigned',
  ])

  return (object: Record<string, unknown>) => Object.fromEntries(Object
    .entries(object)
    .filter(([key]) => keysToKeep.has(key)))
})()
