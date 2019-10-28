import { Application } from '@feathersjs/feathers'
import { snakeCase } from 'change-case'
import feathersKnex from 'feathers-knex'
import buildTableFactory from './buildTableFactory'
import formatTableSchemaFactory from './formatTableSchemaFactory'
import inheritHooks from './inheritHooks'
import formatFields from './formatFields'
import { Blueprint, Options } from './@types'
import setupChannelsFactory from './setupChannelsFactory'

export * from './presets'

export function tableServiceFactory(options: Options = {
  apiBase: '',
  doDropTable: false,
  doMigrateSchema: true,
  doUseSnakeCase: false,
  paginate: {
    default: 10,
    max: 50,
  },
}) {
  const safeCase = (str: string): string => options.doUseSnakeCase ? snakeCase(str) : str
  const formatTableSchema = formatTableSchemaFactory(safeCase)
  const buildTable = buildTableFactory(safeCase)

  return function tableService(name: string, compactBlueprint: Blueprint) {
    if (typeof name !== 'string') {
      throw new Error('First tableService argument is name: String')
    }

    return async function createService(app: Application) {
      try {
        const knex = app.get('knexClient')

        if (!app.getService) {
          app.getService = function getService(name) {
            return app.service(`${options.apiBase}${name}`)
          }

          app.registerService = function registerService(name: string, ...service) {
            const path = `${options.apiBase}${name}`
            app.use(path, ...service)
            return app.getService(name)
          }
        }

        const blueprint = formatTableSchema(name, compactBlueprint)

        const preService = blueprint.service || feathersKnex({
          Model: knex,
          paginate: { ...options.paginate },
          ...blueprint.knex,
        })

        if (!preService) throw new Error(`Could not initialize ${name}`)

        const service = app.registerService(name, preService)

        if (blueprint.hooks) {
          service.hooks(inheritHooks(blueprint.hooks))
        }

        if (blueprint.channels) {
          setupChannelsFactory(app)(service, blueprint.channels)
        }

        if (blueprint.table) {
          blueprint.table.fields = formatFields(blueprint.table.fields)

          if (options.doDropTable) {
            await knex.schema.dropTableIfExists(blueprint.table.name)
            await buildTable(knex, blueprint.table)
          } else if (options.doMigrateSchema) {
            await buildTable(knex, blueprint.table)
          }
        }

        return service
      } catch (err) {
        console.error(err)
        throw err
      }
    }
  }
}

tableServiceFactory.inheritHooks = inheritHooks
