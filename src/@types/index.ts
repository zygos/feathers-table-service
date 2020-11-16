import Feathers from '@feathersjs/feathers'
import { Connection } from '@feathersjs/socket-commons'

declare module '@feathersjs/feathers' {
  interface HookContext {
    debug(s: string): void
  }

  interface Application<ServiceTypes = {}> {
    getService:<L extends keyof ServiceTypes> (location: keyof ServiceTypes extends never ? string : L) => Feathers.Service<ServiceTypes[L]>;
    registerService:<L extends keyof ServiceTypes>(name: L, service: Partial<Feathers.ServiceMethods<ServiceTypes[L]> & Feathers.SetupMethod> | Feathers.Application) => Feathers.Service<ServiceTypes[L]>;

    getTableSchema(name: string): TableSchema
    setTableSchema(name: string, schema: TableSchema): void

    tableService: {
      afterAllDone: {
        [key: string]: any
      }
      afterAll: Function
    }

    logger: Logger
  }
}

declare module 'knex' {
  interface TableBuilder {
    [key: string]: Function
  }
}

export interface Blueprint {
  channels?: { [s: string]: Function } | Function
  hooks?: ServiceHooks
  knex?: {
    name?: string
    params?: {
      Model: any
      paginate: {
        default: number
        max: number
      }
    }
  }
  service?: any
  middleware?: {
    before?: Function | Function[],
    after?: Function | Function[],
  },
  extend?: Object | Function,
  table?: Table
  setup?: Function
  afterAll: Function
}

export type BlueprintFactory = (app: Feathers.Application) => Blueprint

export type EventContext = {
  connection: Connection
}

export interface Logger {
  error(message: string, ...interpolationValues: any[]): void
  info(message: string, ...interpolationValues: any[]): void
  warn(message: string, ...interpolationValues: any[]): void
  debug(message: string, ...interpolationValues: any[]): void
  fatal(message: string, ...interpolationValues: any[]): void
}

export type HookType = 'before' | 'after' | 'error' | 'finally'
export type HookTypeFinal = 'beforeFinal' | 'afterFinal' | 'errorFinal' | 'unknown'

export type HookMethod = 'all'
  | 'allSet'
  | 'allGet'
  | 'create'
  | 'find'
  | 'get'
  | 'update'
  | 'patch'
  | 'remove'

export type HookMethods = {
  [key in HookMethod]?: Function[]
}

export type Indexes = Array<{
  tablename: String
  indexname: String
}>

export type Options = {
  apiBase: string
  doAddColumns: boolean
  doAlterColumns: boolean
  doDropColumns: boolean
  doDropTables: boolean
  doDropTablesForce: boolean
  doMigrateIndexes: boolean
  doMigrateSchema: boolean
  doUseSnakeCase: boolean
  feathersKnex?: any
  globalHooks?: GlobalHooks,
  paginate: {
    default: number
    max: number
  },
  serviceOptions?: object | Function,
}

export type Table = {
  name: string
  schema: TableSchema
}

export type TableSchema = {
  app?: any
  properties: TableSchemaProperties
  required?: string[]
}

export type TableSchemaProperties = {
  [key: string]: any
}

export type ServiceHooks = {
  [key in HookType]?: HookMethods
}

export type GlobalHooks = {
  before?: HookMethods,
  beforeFinal?: HookMethods,
  after?: HookMethods,
  afterFinal?: HookMethods,
  error?: HookMethods,
  errorFinal?: HookMethods,
  unknown?: HookMethods
  finally?: HookMethods
}

export interface Validator {
  [key: string]: any
  compile: Function
}

export interface ConstraintDefinition {
  dropKey?: String,
  format: Function,
  getExisting: Function,
  isSame: Function,
}

export type CaseFunction = (name: string | String, doOverwriteDot?: boolean) => string
