import { Application, HookContext } from '@feathersjs/feathers'
import { Options, Predicate, TableSchema } from './@types'
import { omit } from 'rambda'
import chainPredicate from './hooks/chainPredicate'

import { Channel } from '@feathersjs/socket-commons'

export interface ExtendedChannel extends Channel {
  ctx?: HookContext
}

export default function extendApp(app: Application, { apiBase }: Options) {
  if (typeof app.getService === 'function') return

  app.getService = function getService(name) {
    return app.service(`${apiBase}${name}`)
  }

  app.registerService = function registerService(name: string, ...service) {
    const path = `${apiBase}${name}`
    app.use(path, ...service)
    return app.getService(name)
  }

  app.getTableSchema = function getTableSchema(name: string) {
    return app.get(`tableService.schema.${name}`)
  }

  app.setTableSchema = function setTableSchema(name: string, schema: TableSchema) {
    app.set(`tableService.schema.${name}`, schema)
  }

  async function getFieldsToOmit(access: Record<string, Predicate>, ctx: HookContext) {
    const promises = Object.entries(access).map(async([key, value]) => {
      const keyAllowed = await chainPredicate(value, ctx)
      return !keyAllowed ? key : null
    })
    const results = await Promise.all(promises)

    return results.filter(Boolean) as string[]
  }

  app.processChannels = async function(access: Record<string, Predicate>, channelsNames: string[], record: Record<string, any>) {
    const channels = channelsNames
      .map(channelName => app.channel(channelName))
    return Promise.all(channels
      .map(async(channel: ExtendedChannel) => {
        const { ctx } = channel
        if (!ctx) return channel

        const fieldsToOmit = await getFieldsToOmit(access, ctx)
        const recordSafe = omit(fieldsToOmit, record)
        return channel.send(recordSafe)
      }))
  }

  app.tableService = {
    afterAllDone: new Map(),
    async afterAll(...serviceNames: string[]) {
      const isEveryDone = () => {
        const doneKeys = app.tableService.afterAllDone.keys()

        return serviceNames.every(serviceName => doneKeys.includes(serviceName))
      }

      const getDoneResults = () => serviceNames
        .map(serviceName => app.tableService.afterAllDone.get(serviceName))

      if (isEveryDone()) return getDoneResults()

      return new Promise((resolve) => {
        app.on('tableService.afterAll', ({ serviceName: resolvedServiceName, results }) => {
          if (!app.tableService.afterAllDone.has(resolvedServiceName)) {
            app.tableService.afterAllDone.set(resolvedServiceName, results)
          }

          if (isEveryDone()) resolve(getDoneResults())
        })
      })
    },
  }
}
