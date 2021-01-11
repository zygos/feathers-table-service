import { Application } from '@feathersjs/feathers'
import { Options, TableSchema } from './@types'

interface ServiceSeedResult {
  serviceName: string
  results: Array<Record<string, unknown>>
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

  app.tableService = {
    afterAllDone: new Map(),
    async afterAll(...serviceNames: string[]) {
      const isEveryDone = () => {
        const doneKeys = Array.from(app.tableService.afterAllDone.keys())

        return serviceNames.every(serviceName => doneKeys.includes(serviceName))
      }

      const getDoneResults = () => serviceNames
        .map(serviceName => app.tableService.afterAllDone.get(serviceName))

      return new Promise((resolve) => {
        if (isEveryDone()) return resolve(getDoneResults())

        const eventListener = () => {
          if (!isEveryDone()) return

          app.removeListener('tableService.afterAll', eventListener)
          resolve(getDoneResults())
        }

        app.on('tableService.afterAll', eventListener)
      })
    },
  }
}
