import { castArray } from "../../utils"
import { HookContext } from "@feathersjs/feathers"
import { TableFields } from "../../@types"

export default function defaultsFactory(fields: TableFields) {
  const defaultValues: { [key: string]: any } = {}
  for (const key in fields) {
    if (typeof fields[key].defaultTo !== 'undefined') {
      defaultValues[key] = fields[key].defaultTo
    }
  }

  const applyDefaults = (row: { [key: string]: any }) => {
    for (const key in defaultValues) {
      if (typeof row[key] === 'undefined') {
        row[key] = defaultValues[key]
      }
    }
  }

  return function defaults(hook: HookContext) {
    castArray(hook.data).forEach(applyDefaults)
    return hook
  }
}
