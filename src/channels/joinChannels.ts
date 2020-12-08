import { Application } from '@feathersjs/feathers'
import { Connection } from '@feathersjs/socket-commons'
import { omit } from 'rambda'
import { ExtendedChannel, Predicate } from '../@types'
import getFieldsToOmit from './getFieldsToOmit'

export default async function joinChannels(app: Application, connection: Connection, cofigurations:any, access: Record<string, Predicate>) {
  cofigurations.forEach(async(configuration:any) => {
    const channel: ExtendedChannel = app.channel(configuration.name)
    const ctx = {
      params: {
        authenticated: true,
        provider: 'socketio',
        ...configuration.params,
      },
    }
    channel.ctx = ctx
    const fieldsToOmit = await getFieldsToOmit(access, ctx)
    const omitter = omit(fieldsToOmit)
    channel.omitters = new Map()
    channel.omitters.set(access, omitter)
    channel.join(connection)
  })
}
