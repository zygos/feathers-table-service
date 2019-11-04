import { Application, HookContext } from '@feathersjs/feathers'
import { Connection } from '@feathersjs/socket-commons'
import { EventContext } from './@types'

export default function setupChannelsFactory(app: Application) {
  function getUserConnections(userId: number) {
    if (!app.channels || app.channels.length === 0) return []

    const connections: Connection[] = []
    app
      .channel(app.channels)
      .filter((connection) => {
        if (connection.user.id === userId) {
          connections.push(connection)
        }
        return false
      })

    return connections
  }

  function joinChannel(channelName: string, userId: number) {
    getUserConnections(userId).forEach((connection: Connection) => {
      app.channel(channelName).join(connection)
    })
  }

  function leaveChannel(channelName: string, userId: number) {
    app.channel(channelName)
      .leave((connection: Connection) => userId === connection.user.id)
  }

  return function setupChannels(
    service: any,
    channels: { [key: string]: Function } | Function): void {
    if (!channels) return

    if (typeof channels === 'function') {
      return setupChannels(service, channels({ app, service }))
    }

    const globalEvents = ['connection', 'login', 'logout']

    for (const event in channels) {
      if (globalEvents.includes(event)) {
        app.on(event, (payload: any, context: EventContext) =>
          channels[event](payload, {
            app,
            service,
            user: (context.connection && context.connection.user) ?
              context.connection.user
              : null,
            ...context,
          }))
      } else {
        const eventCallback = (payload: any, ctx: HookContext) =>
          channels[event](payload, { joinChannel, leaveChannel, ...ctx })

        if (event === 'all') {
          service.publish(eventCallback)
        } else {
          service.publish(event, eventCallback)
        }
      }
    }
  }
}
