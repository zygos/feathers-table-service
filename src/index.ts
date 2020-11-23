import { Application } from '@feathersjs/feathers'
import feathersKnexMain from 'feathers-knex'
// import inheritHooks from './inheritHooks'
import { Blueprint, Options, BlueprintFactory } from './@types'
import * as hooks from './hooks'
import extendApp from './extendApp'
import createServiceFactory from './createServiceFactory'

export { hooks }
export * from './presets'
export { default as buildJsonSchema } from './buildJsonSchema'

export function tableServiceFactory({
  apiBase = '',
  doAddColumns = true,
  doAlterColumns = true,
  doDropColumns = true,
  doDropTables = false,
  doDropTablesForce = false,
  doMigrateIndexes = false,
  doMigrateSchema = true,
  doRunAfterAll = true,
  doUseSnakeCase = false,
  feathersKnex = feathersKnexMain,
  globalHooks = {},
  paginate = { default: 10, max: 50 },
  serviceOptions = {},
}: Options) {
  const options = {
    apiBase,
    doAddColumns,
    doAlterColumns,
    doDropColumns,
    doDropTables,
    doDropTablesForce,
    doMigrateIndexes,
    doMigrateSchema,
    doRunAfterAll,
    doUseSnakeCase,
    feathersKnex,
    globalHooks,
    paginate,
    serviceOptions,
  }

  let appReference: Application

  const afterAll: [string, Function][] = []
  const createService = createServiceFactory(options, afterAll)

  const tableService = function tableService(
    name: string,
    compactBlueprint: Blueprint | BlueprintFactory,
  ) {
    if (typeof name !== 'string') {
      throw new Error('First tableService argument is name: String')
    }
    return async function initialize(app: Application) {
      if (!appReference) appReference = app

      extendApp(app, options)

      return createService(name, compactBlueprint, app)
    }
  }

  const runAfterAll = async function runAfterAll(app: Application) {
    const result = doRunAfterAll && await Promise
      .all(afterAll
        .map(async([serviceName, seedFunction]) => {
          const results = await seedFunction(appReference)

          app.emit('tableService.afterAll', {
            serviceName,
            results,
          })
        }))

    if (app && app.emit) {
      app.emit('tableService.ready')
      app.removeAllListeners('tableService.afterAll')
    }

    return result || []
  }

  return {
    tableService,
    runAfterAll,
  }
}

// tableServiceFactory.inheritHooks = inheritHooks
