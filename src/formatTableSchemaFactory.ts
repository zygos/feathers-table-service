import { Blueprint } from './@types'

export default function formatTableSchemaFactory(safeCase: Function) {
  return function formatTableSchema(
    name: string,
    compactBlueprint: Blueprint | Blueprint,
  ): Blueprint {
    compactBlueprint.name = name

    if (!compactBlueprint.service) {
      if (!compactBlueprint.serviceOptions) {
        compactBlueprint.serviceOptions = {}
        if (!compactBlueprint.serviceOptions.name) {
          compactBlueprint.serviceOptions.name = name
        }
      }
    }

    if (compactBlueprint.table && typeof compactBlueprint.table.name === 'undefined') {
      compactBlueprint.table.name = safeCase(name)
    }

    return compactBlueprint
  }
}
