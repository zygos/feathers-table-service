import { Application } from '@feathersjs/feathers'
import { snakeCase } from 'change-case'
import feathersKnex from 'feathers-knex'
import buildTableFactory from './buildTableFactory'
import formatTableSchemaFactory from './formatTableSchemaFactory'
import inheritHooks from './inheritHooks'
import formatFields from './formatFields'
import { Blueprint, Options } from './@types'
import setupChannelsFactory from './setupChannelsFactory'
import * as hooks from './hooks'

export { hooks }
export * from './presets'

export function tableServiceFactory({
  apiBase = '',
  doAlterColumns = true,
  doAddColumns = true,
  doDropColumns = true,
  doDropTables = false,
  doMigrateSchema = true,
  doUseSnakeCase = false,
  paginate = { default: 10, max: 50 },
}: Options) {
  const options = {
    apiBase,
    doAlterColumns,
    doAddColumns,
    doDropColumns,
    doDropTables,
    doMigrateSchema,
    doUseSnakeCase,
    paginate,
  }

  const safeCase = (str: string): string => doUseSnakeCase ? snakeCase(str) : str
  const formatTableSchema = formatTableSchemaFactory(safeCase)
  const buildTable = buildTableFactory(safeCase, options)
  const afterAll: Function[] = []
  let appReference: Application

  const tableServiceFactory = function tableService(name: string, compactBlueprint: Blueprint) {
    if (typeof name !== 'string') {
      throw new Error('First tableService argument is name: String')
    }

    return async function createService(app: Application) {
      try {
        if (!appReference) appReference = app

        const knex = app.get('knexClient')

        if (!app.getService) {
          app.getService = function getService(name) {
            return app.service(`${apiBase}${name}`)
          }

          app.registerService = function registerService(name: string, ...service) {
            const path = `${apiBase}${name}`
            app.use(path, ...service)
            return app.getService(name)
          }
        }

        const blueprint = formatTableSchema(name, compactBlueprint)

        const preService = blueprint.service || feathersKnex({
          Model: knex,
          paginate: { ...paginate },
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

          if (doMigrateSchema) {
            if (doDropTables) {
              await knex.schema.dropTableIfExists(blueprint.table.name)
            }
            await buildTable(knex, blueprint.table)
          }
        }

        if (blueprint.setup) {
          await blueprint.setup(app)
        }

        if (blueprint.afterAll) {
          afterAll.push(blueprint.afterAll)
        }

        return service
      } catch (err) {
        console.error(err)
        throw err
      }
    }
  }

  tableServiceFactory.runAfter = function runAfter() {
    return Promise.all(afterAll.map(fn => fn(appReference)))
  }

  return tableServiceFactory
}

tableServiceFactory.inheritHooks = inheritHooks
