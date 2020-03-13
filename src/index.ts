import { Application } from '@feathersjs/feathers'
import { snakeCase, snake } from 'change-case'
import feathersKnex from 'feathers-knex'
import buildTableFactory from './buildTableFactory'
import formatTableSchemaFactory from './formatTableSchemaFactory'
import inheritHooks from './inheritHooks'
import formatSchema from './formatSchema'
import { Blueprint, Options, BlueprintFactory, TableSchema } from './@types'
import migrateIndexesFactory from './migrateIndexesFactory'
import setupChannelsFactory from './setupChannelsFactory'
import * as hooks from './hooks'
import { castArray } from './utils'

export { hooks }
export * from './presets'
export { default as buildJsonSchema } from './buildJsonSchema'

export function tableServiceFactory({
  apiBase = '',
  doAlterColumns = true,
  doAddColumns = true,
  doDropColumns = true,
  doDropTables = false,
  doDropTablesForce = false,
  doMigrateIndexes = false,
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
    doDropTablesForce,
    doMigrateIndexes,
    doMigrateSchema,
    doUseSnakeCase,
    paginate,
  }

  const safeCase = (str: string, doOverwriteDot = false): string => {
    if (!doUseSnakeCase) return str

    if (!doOverwriteDot && str.includes('.')) {
      return str
        .split('.')
        .map(substring => snakeCase(substring))
        .join('.')
    }

    return snakeCase(str)
  }

  const formatTableSchema = formatTableSchemaFactory(safeCase)
  const buildTable = buildTableFactory(safeCase, options)
  const migrateIndexes = migrateIndexesFactory(safeCase, options)
  const afterAll: Function[] = []
  let appReference: Application

  const tableServiceFactory = function tableService(
    name: string,
    compactBlueprint: Blueprint | BlueprintFactory,
  ) {
    if (typeof name !== 'string') {
      throw new Error('First tableService argument is name: String')
    }

    return async function createService(app: Application) {
      if (!appReference) appReference = app

      if (typeof compactBlueprint === 'function') {
        compactBlueprint = compactBlueprint(app)
      }

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
        app.getTableSchema = function getTableSchema(name) {
          return app.get(`tableService.schema.${name}`)
        }
        app.setTableSchema = function setTableSchema(name: String, schema: TableSchema) {
          app.set(`tableService.schema.${name}`, schema)
        }
      }

      const blueprint = formatTableSchema(name, compactBlueprint)

      const feathersService = (() => {
        const rawService = blueprint.service || feathersKnex({
          Model: knex,
          paginate: { ...paginate },
          ...blueprint.knex,
        })

        if (!blueprint.extend || typeof rawService.extend !== 'function') return rawService

        const serviceExtension = typeof blueprint.extend === 'function'
          ? blueprint.extend(app)
          : blueprint.extend

        return rawService.extend(serviceExtension)
      })()

      if (!feathersService) throw new Error(`Could not initialize ${name}`)

      const serviceChain = [
        ...castArray((blueprint.middleware || {}).before || []),
        ...castArray(feathersService),
        ...castArray((blueprint.middleware || {}).after || []),
      ]

      const service = (app.registerService as any)(name, ...serviceChain)

      if (blueprint.hooks) {
        service.hooks(inheritHooks(blueprint.hooks))
      }

      if (blueprint.channels) {
        setupChannelsFactory(app)(service, blueprint.channels)
      }

      if (blueprint.table) {
        blueprint.table.schema = formatSchema(blueprint.table.schema)
        app.setTableSchema(name, blueprint.table.schema)

        if (doMigrateSchema) {
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

      if (blueprint.afterAll) {
        afterAll.push(blueprint.afterAll)
      }

      app.emit(`tableService.${name}.ready`)

      if (feathersService.emit) {
        feathersService.emit('ready')
      }

      return service
    }
  }

  tableServiceFactory.runAfter = async function runAfter(app: Application | void) {
    const result = await Promise.all(afterAll.map(fn => fn(appReference)))

    if (app && app.emit) app.emit('ready')

    return result
  }

  return tableServiceFactory
}

tableServiceFactory.inheritHooks = inheritHooks
