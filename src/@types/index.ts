import { Connection } from '@feathersjs/socket-commons'

declare module '@feathersjs/feathers' {
  interface HookContext {
    debug(s: string): void
  }

  interface Application<ServiceTypes = {}> {
    registerService(name: string, service: any): any
    getService(name: string): any

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
  table?: Table
  setup?: Function
  afterAll: Function
}

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

export type HookType = 'before' | 'after' | 'error'

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

export type Options = {
  apiBase: string
  doAlterColumns: boolean
  doAddColumns: boolean
  doDropColumns: boolean
  doDropTables: boolean
  doMigrateSchema: boolean
  doUseSnakeCase: boolean
  paginate: {
    default: number
    max: number
  },
}

export type ValidateOptions = {
  inheritNullable: boolean
}

export type Table = {
  name: string
  fields: TableFields
}

export type TableFields = {
  [key: string]: any
}

export type ServiceHooks = {
  [key in HookType]?: HookMethods
}

export interface Validator {
  [key: string]: any
  compile: Function
}
