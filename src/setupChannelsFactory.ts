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
      // deepcode ignore PureMethodReturnValueIgnored: not an array
      app.channel(channelName).join(connection)
    })
  }

  function leaveChannel(channelName: string, userId: number) {
    app.channel(channelName)
      .leave((connection: Connection) => userId === connection.user.id)
  }

  const globalEvents = ['connection', 'login', 'logout']
  const joinLeaveUtils = Object.freeze({ joinChannel, leaveChannel })

  return function setupChannels(
    service: any,
    channels: { [key: string]: Function } | Function,
  ): void {
    if (!channels) return

    const appServiceObject = Object.freeze({ app, service })

    if (typeof channels === 'function') {
      return setupChannels(service, channels(appServiceObject))
    }

    for (const event in channels) {
      if (globalEvents.includes(event)) {
        app.on(event, (payload: any, context: EventContext) =>
          channels[event](payload, context, appServiceObject))
      } else {
        const eventCallback = (payload: any, ctx: HookContext) =>
          channels[event](payload, ctx, joinLeaveUtils)

        if (event === 'all') {
          service.publish(eventCallback)
        } else {
          service.publish(event, eventCallback)
        }
      }
    }
  }
}
