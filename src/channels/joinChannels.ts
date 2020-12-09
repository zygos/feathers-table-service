import { Application, HookContext } from '@feathersjs/feathers'
import { Connection } from '@feathersjs/socket-commons'
import { ExtendedChannel } from '../@types'

export default async function joinChannels(app: Application, connection: Connection, cofigurations:any) {
  const channels:ExtendedChannel[] = cofigurations.map((configuration: any) => {
    const channel: ExtendedChannel = app.channel(configuration.name)
    if (!channel.ctx) {
      channel.ctx = {
        params: {
          authenticated: true,
          provider: 'socketio',
          ...configuration.params,
        },
      } as HookContext
    }
    return channel
  })
  channels.forEach((channel) => {
    channel.join(connection)
  })
}
