import { Blueprint, BlueprintFactory, ColumnInfo, Options, PropertiesInfo } from './@types'
import { JSONB, STRING } from './presets'
import { Application } from '@feathersjs/feathers'
import { groupBy, prop } from 'rambda'
import buildTableFactory from './buildTableFactory'
import formatSchema from './formatSchema'
import formatTableSchemaFactory from './formatTableSchemaFactory'
import inheritHooks from './inheritHooks'
import migrateIndexesFactory from './migrateIndexesFactory'
import safeCaseFactory from './safeCaseFactory'
import setupChannelsFactory from './setupChannelsFactory'
import { castArray, maybeCall } from './utils'
import { TABLE_SERVICE_SCHEMAS } from './consts'

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
    serviceOptions: serviceOptionsGlobal,
  } = options

  const getColumnsAndProperties = (() => {
    let resultPending: Promise<{
      columnsMap: Record<string, ColumnInfo[]>
      propertiesExistingMap: Record<string, PropertiesInfo[]>
    }>

    return (knex: any) => {
      // run lazily only if needed
      if (!resultPending && knex) {
        resultPending = (async() => {
          const [
            schemaInfo,
            propertiesInfo,
          ]: [Record<string, ColumnInfo[]>, PropertiesInfo[]] = await Promise.all([
            knex.schema
              .raw('select * from information_schema.columns where table_schema = current_schema()'),
            (async() => {
              const hasSchemasTable = await knex.schema
                .hasTable(TABLE_SERVICE_SCHEMAS)

              if (!hasSchemasTable) {
                await buildTable(knex, [], {}, {
                  name: TABLE_SERVICE_SCHEMAS,
                  schema: {
                    properties: {
                      tableName: STRING({
                        primary: true,
                      }),
                      properties: JSONB(),
                    },
                  },
                })

                return []
              }

              return await knex(TABLE_SERVICE_SCHEMAS).select()
            })(),
          ])

          const columnsExisting: ColumnInfo[] = schemaInfo.rows

          return {
            columnsMap: groupBy(prop('tableName'), columnsExisting),
            propertiesExistingMap: groupBy(prop('tableName'), propertiesInfo),
          }
        })()
      }

      return resultPending
    }
  })()

  async function createService(
    name: string,
    blueprintProvided: Blueprint | BlueprintFactory,
    app: Application,
  ) {
    if (typeof blueprintProvided === 'function') {
      blueprintProvided = blueprintProvided(app)
    }

    const knex = app.get('knexClient')

    const { columnsMap, propertiesExistingMap } = await getColumnsAndProperties(knex)
    const blueprint = formatTableSchema(name, blueprintProvided)

    const feathersServiceFactory = () => {
      const rawService = blueprint.service || (blueprint.serviceClass || feathersKnex)({
        ...maybeCall(serviceOptionsGlobal, [app]),
        ...blueprint.serviceOptions,
      })

      // assign table schema name to custom services
      if (blueprint.service && blueprint.table && !blueprint.table.name) {
        if (Array.isArray(blueprint.service)) {
          const serviceInstance = blueprint.service
            .filter(Boolean)
            .find(service => service.constructor?.name === 'Service')

          if (serviceInstance) {
            serviceInstance.options = {
              name,
              ...serviceInstance.options || {},
            }
          }
        } else {
          rawService.options = {
            name,
            ...rawService.options || {},
          }
        }
      }

      if (!blueprint.extend || typeof rawService.extend !== 'function') {
        return rawService
      }

      const serviceExtension = typeof blueprint.extend === 'function'
        ? blueprint.extend(app)
        : blueprint.extend

      return rawService.extend(serviceExtension)
    }

    const feathersService = feathersServiceFactory()

    if (!feathersService) throw new Error(`Could not initialize ${name}`)

    const serviceChain = [
      ...castArray((blueprint.middleware || {}).before || []),
      ...castArray(feathersService),
      ...castArray((blueprint.middleware || {}).after || []),
    ]

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

        const tableName = safeCase(blueprint.table.name)
        const propertiesExisting = propertiesExistingMap[tableName]
          ? propertiesExistingMap[tableName][0].properties
          : {}

        await buildTable(
          knex,
          columnsMap[tableName],
          propertiesExisting,
          blueprint.table,
        )

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
      await lifecycle.processBlueprintAfter(blueprint, app)
    }

    app.emit(`tableService.${name}.ready`)

    if (feathersService.emit) {
      feathersService.emit('ready')
    }

    return service
  }

  return createService
}
