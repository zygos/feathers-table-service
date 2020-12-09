import Feathers, { Application, HookContext, Service, ServiceMethods } from '@feathersjs/feathers'
import { Connection, Channel } from '@feathersjs/socket-commons'

export type HookPredicateAsync = (ctx: HookContext) => PredicateBoolAsync
export type HookPredicateSync = (ctx: HookContext) => boolean
export type HookPredicate = HookPredicateSync | HookPredicateAsync
export type PredicateBoolAsync = Promise<boolean>
export type PredicateBool = boolean | PredicateBoolAsync
export type Predicate = PredicateBool | HookPredicate

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

export interface SharedQueueRecord {
  name: string
  cron?: string
  delay?: number
  every?: number
  limit?: number
  isImmediate?: boolean
  handler: (blueprint: Blueprint, app: Application) => unknown
}

// TODO: rename, split into stricter types, one with ctx, another extending it with omitters
export interface ExtendedChannel extends Channel {
  ctx?: HookContext
  omitters?: Map<Record<string, Predicate>, <T>(obj: T) => Pick<T, Exclude<keyof T, string>>>
}

export interface Blueprint {
  name?: string
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
  afterAll?: Function
  queue?: SharedQueueRecord[]
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

export type HookMethod = 'create'
| 'find'
| 'get'
| 'update'
| 'patch'
| 'remove'

export type HookMethodAll = 'all'
  | 'allSet'
  | 'allGet'
  | HookMethod

export type HookMethodsAll = {
  [key in HookMethodAll]?: Function[]
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
  doRunAfterAll: boolean
  doUseSnakeCase: boolean
  feathersKnex?: any
  globalHooks?: GlobalHooks,
  lifecycle?: {
    processBlueprintAfter?: Function
  },
  paginate: {
    default: number
    max: number
  },
  runAfterAllServices: string[] | null,
  serviceOptions?: object | Function,
}

export type Table = {
  name: string
  schema: TableSchema
}

export interface TableSchema {
  type?: string
  properties: TableSchemaProperties
  required?: string[]
  stash?: {
    data?: DataStashSchema
    query?: StashSchema
  }
}

export interface StashSchema {
  [key: string]: TableSchemaProperties
}

export interface DataStashSchema extends StashSchema {
  [key: string]: TableSchemaCascade
}

export interface TableSchemaCascade extends TableSchema {
  cascade?: CascadeSchema
}

// TODO: use serviceName in Application<ServiceTypes>
export interface CascadeSchema {
  methods: HookMethod[]
  serviceName: string
  stashKey: string
  type: number
}

// TODO: add definition
export interface TableSchemaProperties {
  [key: string]: any
}

export type ServiceHooks = {
  [key in HookType]?: HookMethodsAll
}

export type GlobalHooks = {
  before?: HookMethodsAll,
  beforeFinal?: HookMethodsAll,
  after?: HookMethodsAll,
  afterFinal?: HookMethodsAll,
  error?: HookMethodsAll,
  errorFinal?: HookMethodsAll,
  unknown?: HookMethodsAll
  finally?: HookMethodsAll
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
