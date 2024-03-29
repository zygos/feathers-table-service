import { Application } from '@feathersjs/feathers'
// import inheritHooks from './inheritHooks'
import { Blueprint, Options, BlueprintFactory } from './@types'
import * as hooks from './hooks'
import channels from './channels'

import extendApp from './extendApp'
import createServiceFactory from './createServiceFactory'

export { hooks }
export { channels }
export * from './presets'
export { default as buildJsonSchema } from './buildJsonSchema'

export function tableServiceFactory({
  apiBase = '',
  doAddColumns = true,
  doAlterColumns = true,
  doAlterColumnsBypass = false,
  doDropColumns = true,
  doDropTables = false,
  doDropTablesForce = false,
  doMigrateIndexes = false,
  doMigrateSchema = true,
  doRunAfterAll = true,
  doUseSnakeCase = false,
  feathersKnex,
  lifecycle = {},
  globalHooks = {},
  runAfterAllServices = null,
  serviceOptions = {},
}: Options) {
  const options = {
    apiBase,
    doAddColumns,
    doAlterColumns,
    doAlterColumnsBypass,
    doDropColumns,
    doDropTables,
    doDropTablesForce,
    doMigrateIndexes,
    doMigrateSchema,
    doRunAfterAll,
    doUseSnakeCase,
    lifecycle,
    feathersKnex,
    globalHooks,
    runAfterAllServices,
    serviceOptions,
  }

  let appReference: Application

  const afterAll: [string, Function][] = []
  const createService = createServiceFactory(options, afterAll)

  const tableService = function tableService(
    name: string,
    blueprintCompact: Blueprint | BlueprintFactory,
  ) {
    if (typeof name !== 'string') {
      throw new Error('First tableService argument is name: String')
    }

    return async function initialize(app: Application) {
      if (!appReference) appReference = app

      extendApp(app, options)

      return createService(name, blueprintCompact, app)
    }
  }

  const runAfterAll = async function runAfterAll(app: Application) {
    const result = doRunAfterAll && await Promise
      .all(afterAll
        .filter(([serviceName]) =>
          !runAfterAllServices || runAfterAllServices.includes(serviceName))
        .map(async([serviceName, seedFunction]) => {
          const results = await seedFunction(appReference)

          app.tableService.afterAllDone.set(serviceName, results)

          app.emit('tableService.afterAll', {
            serviceName,
            results,
          })
        }))

    if (app && app.emit) {
      app.emit('tableService.ready')
    }

    return result || []
  }

  return {
    tableService,
    runAfterAll,
  }
}

// tableServiceFactory.inheritHooks = inheritHooks
