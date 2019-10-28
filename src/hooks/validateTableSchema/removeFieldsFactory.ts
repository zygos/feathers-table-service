import { HookContext } from '@feathersjs/feathers'
import { TableFields } from '../../@types'
import { castArray } from '../../utils'

export default function removeFieldsFactory(fields: TableFields) {
  const fieldsSet = new Set(Object.keys(fields))

  function removeFields(row: { [key: string]: any }) {
    for (const key in row) {
      if (!fieldsSet.has(key)) delete row[key]
    }
  }

  return (hook: HookContext) => {
    castArray(hook.data).forEach(removeFields)
    return hook
  }
}
