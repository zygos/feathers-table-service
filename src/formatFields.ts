import { TableFields } from './@types'

const maybeCall = (fn: any) => typeof fn === 'function' ? fn() : fn

const defaultField = {
  comment: null,
  defaultTo: undefined,
  inTable: null,
  nullable: true,
  onDelete: null,
  onUpdate: null,
  type: 'string',
  transform: undefined,
  transformForce: false,
  primary: false,
  references: null,
  unique: false,
  validate: undefined,
}

export default function formatFields(fields: TableFields): TableFields {
  if (!fields) throw new Error('No table fields provided')

  for (const columnName in fields) {
    fields[columnName] = { ...defaultField, ...maybeCall(fields[columnName]) }
  }

  return fields
}