import { HookContext } from '@feathersjs/feathers'
import { TableSchemaProperties } from '../../@types'

export default function transformsFactory(properties: TableSchemaProperties) {
  const transformsMap: { [key: string]: Function } = {}
  for (const key in properties) {
    if (typeof properties[key].transform === 'function') {
      transformsMap[key] = properties[key].transform
    }
  }

  const applyTransforms = (row: any, ctx: HookContext) => {
    for (const key in transformsMap) {
      const value = transformsMap[key](row[key], ctx)

      if (value === undefined) {
        delete row[key]
      } else {
        row[key] = value
      }
    }
  }

  return function transforms(ctx: HookContext) {
    if (Array.isArray(ctx.data)) {
      ctx.data.forEach(record => applyTransforms(record, ctx))
    } else {
      applyTransforms(ctx.data, ctx)
    }
  }
}
