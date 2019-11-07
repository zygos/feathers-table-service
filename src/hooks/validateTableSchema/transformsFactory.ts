import { HookContext } from "@feathersjs/feathers"
import { castArray } from "../../utils"
import { TableFields } from "../../@types"

export default function transformsFactory(fields: TableFields) {
  const transformsMap: { [key: string]: Function } = {}
  for (const key in fields) {
    if (typeof fields[key].transform === 'function') {
      transformsMap[key] = fields[key].transform
    }
  }

  const applyTransforms = (row: any) => {
    for (const key in transformsMap) {
      if (typeof row[key] !== 'undefined' || fields[key].forceTransform) {
        row[key] = transformsMap[key](row[key])
      }
    }
  }

  return function transforms(ctx: HookContext) {
    castArray(ctx.data).forEach(applyTransforms)
    return ctx
  }
}
