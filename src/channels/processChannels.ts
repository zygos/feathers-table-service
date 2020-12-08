import { ExtendedChannel, Predicate } from '../@types'
import { omit } from 'rambda'
import getFieldsToOmit from './getFieldsToOmit'
import { Application } from '@feathersjs/feathers'

export default async function processChannels(app: Application, access: Record<string, Predicate>, channelsNames: string[], record: Record<string, any>) {
  const channels = channelsNames
    .map(channelName => app.channel(channelName))
  return Promise.all(channels
    .map(async(channel: ExtendedChannel) => {
      const { ctx } = channel
      if (!ctx) return channel

      if (!channel.omitters) {
        console.log('Channel omitters empty')
        channel.omitters = new Map()
      }

      if (!channel.omitters.has(access)) {
        const fieldsToOmit = await getFieldsToOmit(access, ctx)
        const omitter = omit(fieldsToOmit)
        channel.omitters.set(access, omitter)
      }

      return channel.send(channel.omitters.get(access)(record))
    }))
}
