import { ConstraintDefinition } from './@types'
import { isPlainObject, castArray } from './utils'
import Knex = require('knex')

function invalidConstraintError(constraintTypeName: String, tableName: String, columnName: String) {
  return new Error(`Invalid "${constraintTypeName}" constraint for ${tableName}.${columnName}`)
}

function areVirtuallySameArrays(array1: string[], array2: string[]) {
  return Array.isArray(array1) &&
  Array.isArray(array2) &&
  array1.length === array2.length &&
  array1.every(element => array2.includes(element)) &&
  array2.every(element => array1.includes(element))
}

// TODO: migrate nullable constraints
export const constraintTypes: { [key: string]: ConstraintDefinition } = {
  references: {
    dropKey: 'dropForeign',
    format(tableName: String, columnName: String, constraint: any, _: any, safeCase: Function) {
      const defaultConstraint = {
        columns: [safeCase(columnName)],
        name: `${tableName}_${safeCase(columnName)}_foreign`,
        onDelete: null,
        onUpdate: null,
      }

      if (typeof constraint === 'string') {
        return {
          ...defaultConstraint,
          references: [safeCase(constraint)],
        }
      }

      if (Array.isArray(constraint)) {
        return {
          ...defaultConstraint,
          references: constraint.map((column: string) => safeCase(column)),
        }
      }

      if (isPlainObject(constraint)) {
        if (!constraint.references) {
          throw new Error('No foreign key "references" key provided.')
        }

        return {
          ...defaultConstraint,
          ...constraint,
          columns: constraint.columns
            ? castArray(constraint.columns).map((column: string) => safeCase(column))
            : defaultConstraint.columns,
          references: castArray(constraint.references)
            .map((column: string) => safeCase(column)),
        }
      }

      throw invalidConstraintError('references', tableName, columnName)
    },
    async getExisting(knex: Knex, tableName: any) {
      return (await knex.raw(`
        SELECT
          tc.table_schema AS "tableSchema",
          tc.constraint_name AS "constraintName",
          tc.table_name AS "tableName",
          kcu.column_name AS "columnName",
          ccu.table_schema AS "foreignTableSchema",
          ccu.table_name AS "foreignTableName",
          ccu.column_name AS "foreignColumnName"
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = ?;`, tableName))
        .rows
        .map((foreignKey: any) => [
          foreignKey.columnName,
          'references',
          {
            // TODO: test multi-column foreign keys
            columns: [foreignKey.columnName],
            references: [`${foreignKey.foreignTableName}.${foreignKey.foreignColumnName}`],
            name: foreignKey.constraintName,

            // TODO: add
            onDelete: null,
            onUpdate: null,
          },
        ])
    },
    isSame(a: any, b: any) {
      return a.name === b.name &&
        areVirtuallySameArrays(a.columns, b.columns) &&
        typeof a.references === typeof b.references &&
          (
            Array.isArray(a.references)
              ? areVirtuallySameArrays(a.references, b.references)
              : a.references === b.references
          )
    },
  },

  index: {
    format(tableName: String, columnName: String, constraint: any, _: any, safeCase: Function) {
      const defaultConstraint = {
        columns: [safeCase(columnName)],
        type: 'btree',
        name: `${tableName}_${safeCase(columnName)}_index`,
      }

      if (constraint === true) {
        return defaultConstraint
      }

      if (Array.isArray(constraint)) {
        return {
          ...defaultConstraint,
          columns: constraint.map(column => safeCase(column)),
          name: joinWithSafeCase(constraint, safeCase, { prefix: tableName, suffix: 'index' }),
        }
      }

      if (isPlainObject(constraint)) {
        return {
          ...defaultConstraint,
          name: joinWithSafeCase(
            castArray(constraint.columns),
            safeCase,
            { prefix: tableName, suffix: 'index' }),
          ...constraint,
          columns: constraint.columns
            ? castArray(constraint.columns).map((column: string) => safeCase(column))
            : defaultConstraint.columns,
        }
      }

      throw invalidConstraintError('index', tableName, columnName)
    },
    async getExisting(knex: Knex, tableName: any) {
      return (await knex.raw(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = ?;`, tableName))
        .rows
        .filter((index: any) => !index.indexname.endsWith('_pkey'))
        .map((index: any) => {
          const [columnName, constraintType] = inferNames(index.indexname, tableName)
          const [indexType, columnsRaw] = index
            .indexdef
            .split('USING ')
            .slice(-1)[0]
            .replace(')', '')
            .split(' (')
          const columns = columnsRaw
            .split(',')
            .map((column: string) => column.trim())

          return [
            columnName,
            constraintType,
            {
              columns,
              type: indexType,
              name: index.indexname,
            },
          ]
        })
    },
    isSame(a: any, b: any) {
      return a.name === b.name &&
        a.type === b.type &&
        areVirtuallySameArrays(a.columns, b.columns)
    },
  },

  unique: {
    format(tableName: String, columnName: String, constraint: any, _: any, safeCase: Function) {
      const defaultConstraint = {
        columns: [safeCase(columnName)],
        name: `${tableName}_${safeCase(columnName)}_unique`,
      }

      if (constraint === true) {
        return defaultConstraint
      }

      if (Array.isArray(constraint)) {
        return {
          ...defaultConstraint,
          columns: constraint.map(column => safeCase(column)),
          name: joinWithSafeCase(constraint, safeCase, { prefix: tableName, suffix: 'unique' }),
        }
      }

      if (isPlainObject(constraint)) {
        return {
          ...defaultConstraint,
          name: joinWithSafeCase(
            castArray(constraint.columns),
            safeCase,
            { prefix: tableName, suffix: 'unique' }),
          ...constraint,
          columns: constraint.columns
            ? castArray(constraint.columns).map((column: string) => safeCase(column))
            : defaultConstraint.columns,
        }
      }

      throw invalidConstraintError('unique', tableName, columnName)
    },
    getExisting() {
      return []
    },
    isSame(a: any, b: any) {
      return a.name === b.name &&
        areVirtuallySameArrays(a.columns, b.columns)
    },
  },
}

export const constraintTypesKeys = Object.keys(constraintTypes)

export function inferNames(constraintName: String, tableName: String): [string, string] {
  const constraintNameWithoutTable = constraintName.replace(`${tableName}_`, '')
  const constraintSplit = constraintNameWithoutTable.split('_')

  return [
    constraintSplit.slice(0, -1).join('_'),
    constraintSplit.slice(-1)[0],
  ]
}

function joinWithSafeCase(array: string[], safeCase: Function, { prefix, suffix }: any) {
  return [
    prefix,
    ...array
      .map((columnName: any) => safeCase(columnName, true)),
    suffix,
  ].join('_')
}
