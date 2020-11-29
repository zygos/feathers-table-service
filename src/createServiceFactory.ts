import { Application } from '@feathersjs/feathers'
import { Blueprint, BlueprintFactory, Options } from './@types'
import buildTableFactory from './buildTableFactory'
import formatSchema from './formatSchema'
import formatTableSchemaFactory from './formatTableSchemaFactory'
import inheritHooks from './inheritHooks'
import migrateIndexesFactory from './migrateIndexesFactory'
import safeCaseFactory from './safeCaseFactory'
import setupChannelsFactory from './setupChannelsFactory'
import { castArray, maybeCall } from './utils'

export default function createServiceFactory(options: Options, afterAll: [string, Function][]) {
  const safeCase = safeCaseFactory(options)
  const formatTableSchema = formatTableSchemaFactory(safeCase)
  const buildTable = buildTableFactory(safeCase, options)
  const migrateIndexes = migrateIndexesFactory(safeCase, options)

  const {
    doDropTables,
    doDropTablesForce,
    doMigrateIndexes,
    doMigrateSchema,
    feathersKnex,
    globalHooks = {},
    lifecycle = {},
    paginate,
    serviceOptions,
  } = options

  async function createService(
    name: string,
    blueprintProvided: Blueprint | BlueprintFactory,
    app: Application,
  ) {
    if (typeof blueprintProvided === 'function') {
      blueprintProvided = blueprintProvided(app)
    }

    const knex = app.get('knexClient')
    const blueprint = formatTableSchema(name, blueprintProvided)

    const feathersServiceFactory = () => {
      const rawService = blueprint.service || feathersKnex({
        Model: knex,
        // TODO: move paginate to serviceOptions
        paginate: { ...paginate },
        ...maybeCall(serviceOptions),
        ...blueprint.knex,
      })

      if (!blueprint.extend || typeof rawService.extend !== 'function') return rawService

      const serviceExtension = typeof blueprint.extend === 'function'
        ? blueprint.extend(app)
        : blueprint.extend

      return rawService.extend(serviceExtension)
    }

    const feathersService = feathersServiceFactory()

    if (!feathersService) throw new Error(`Could not initialize ${name}`)

    const serviceChain = [
      // ...castArray((blueprint.middleware || {}).before || []),
      ...castArray(feathersService),
      // ...castArray((blueprint.middleware || {}).after || []),
    ]

    // console.log('registerService', name)

    const service = (app.registerService as any)(name, ...serviceChain)

    if (blueprint.hooks) {
      service.hooks(inheritHooks(blueprint.hooks, globalHooks))
    }

    if (blueprint.channels) {
      setupChannelsFactory(app)(service, blueprint.channels)
    }

    if (blueprint.table) {
      blueprint.table.schema = formatSchema(blueprint.table.schema)
      app.setTableSchema(name, blueprint.table.schema)

      if (doMigrateSchema && typeof blueprint.table.name === 'string') {
        if (doDropTables) {
          try {
            await knex.schema.dropTableIfExists(blueprint.table.name)
          } catch (err) {
            if (!doDropTablesForce) throw err

            await knex.raw(`DROP TABLE IF EXISTS "${blueprint.table.name}" CASCADE`)
          }
        }

        await buildTable(knex, blueprint.table)

        if (!doDropTables && doMigrateIndexes) {
          await migrateIndexes(knex, blueprint.table)
        }
      }
    }

    if (blueprint.setup) {
      await blueprint.setup(app, feathersService)
    }

    app.emit(`tableService.${name}.setup`)

    if (feathersService.emit) {
      feathersService.emit('setup')
    }

    // TODO: move out of createServiceFactory
    if (blueprint.afterAll) {
      afterAll.push([name, blueprint.afterAll])
    }

    if (typeof lifecycle.processBlueprintAfter === 'function') {
      await lifecycle.processBlueprintAfter(blueprint)
    }

    app.emit(`tableService.${name}.ready`)

    if (feathersService.emit) {
      feathersService.emit('ready')
    }

    return service
  }

  return createService
}
