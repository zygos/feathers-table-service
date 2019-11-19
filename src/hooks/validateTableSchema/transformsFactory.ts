import { HookContext } from "@feathersjs/feathers"
import { castArray } from "../../utils"
import { TableSchemaProperties } from "../../@types"

export default function transformsFactory(properties: TableSchemaProperties) {
  const transformsMap: { [key: string]: Function } = {}
  for (const key in properties) {
    if (typeof properties[key].transform === 'function') {
      transformsMap[key] = properties[key].transform
    }
  }

  const applyTransforms = (row: any) => {
    for (const key in transformsMap) {
      if (typeof row[key] !== 'undefined' || properties[key].forceTransform) {
        row[key] = transformsMap[key](row[key])
      }
    }
  }

  return function transforms(ctx: HookContext) {
    castArray(ctx.data).forEach(applyTransforms)
    return ctx
  }
}
