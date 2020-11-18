import { Application } from '@feathersjs/feathers'
import { Blueprint, BlueprintFactory } from './@types'

const Proto = require('uberproto')

class LazyService {
  app: Application
  building: null | Promise<void>
  blueprintFactory: Blueprint | BlueprintFactory
  id: any
  location: string
  name: string
  serviceBuilt: any
  serviceFactory: Function

  constructor(options: any) {
    this.app = options.app
    this.blueprintFactory = options.blueprintFactory
    this.building = null
    this.id = options.id || 'id'
    this.location = `${options.apiBase}${options.name}`
    this.name = options.name
    this.serviceBuilt = null
    this.serviceFactory = options.serviceFactory
  }

  extend(object: any) {
    return Proto.extend(object, this)
  }

  async buildService() {
    let doneBuilding: any

    this.building = new Promise((resolve) => {
      doneBuilding = resolve
    })

    // remove lazy service
    // delete this.app.services[this.location]

    // register active service on top of it
    const { app } = this

    this.serviceBuilt = await this.serviceFactory(this.name, this.blueprintFactory, app)
    // app.services[this.location] = serviceBuilt

    // this.extend(this.serviceBuilt)
    if (typeof doneBuilding === 'function') {
      doneBuilding()
    }
  }

  async get(id: any, params: any) {
    if (this.building) await this.building
    if (!this.serviceBuilt) await this.buildService()

    return this.serviceBuilt.get(id, params)
  }

  async find(params: any) {
    if (this.building) await this.building
    if (!this.serviceBuilt) await this.buildService()

    const { serviceBuilt } = this

    return serviceBuilt.find(params)
  }

  async create(data: any, params: any) {
    if (this.building) await this.building
    if (!this.serviceBuilt) await this.buildService()

    return this.serviceBuilt.create(data, params)
  }

  async patch(id: any, data: any, params: any) {
    if (this.building) await this.building
    if (!this.serviceBuilt) await this.buildService()

    return this.serviceBuilt.patch(id, data, params)
  }

  async update(id: any, data: any, params: any) {
    if (this.building) await this.building
    if (!this.serviceBuilt) await this.buildService()

    return this.serviceBuilt.update(id, data, params)
  }

  async remove(id: any, params: any) {
    if (this.building) await this.building
    if (!this.serviceBuilt) await this.buildService()

    return this.serviceBuilt.remove(id, params)
  }
}

function init(options: any) {
  return new LazyService(options)
}

init.Service = LazyService

export default init
