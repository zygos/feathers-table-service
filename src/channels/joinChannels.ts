import { Application, HookContext } from '@feathersjs/feathers'
import { Connection } from '@feathersjs/socket-commons'
import { ChannelWithContext, Configuration } from '../@types'

export default async function joinChannels(app: Application, connection: Connection, cofigurations: Configuration[]) {
  const channels:ChannelWithContext[] = cofigurations.map((configuration) => {
    const channel: ChannelWithContext = app.channel(configuration.name)
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
