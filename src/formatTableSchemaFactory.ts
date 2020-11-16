import { Blueprint } from './@types'

export default function formatTableSchemaFactory(safeCase: Function) {
  return function formatTableSchema(
    name: string,
    compactBlueprint: Blueprint | Blueprint,
  ): Blueprint {
    if (!compactBlueprint.service) {
      if (!compactBlueprint.knex) {
        compactBlueprint.knex = {}
        if (!compactBlueprint.knex.name) {
          compactBlueprint.knex.name = name
        }
      }
    }

    if (compactBlueprint.table && !compactBlueprint.table.name) {
      compactBlueprint.table.name = safeCase(name)
    }

    return compactBlueprint
  }
}