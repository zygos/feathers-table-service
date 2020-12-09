import { ExtendedChannel, Predicate } from '../@types'
import { Application } from '@feathersjs/feathers'
import getOmitter from './getOmitter'

export default async function sendDataToChannels(
  app: Application,
  access: Record<string, Predicate>,
  channelsNames: string[],
  record: Record<string, any>,
) {
  if (!record) return []

  return Promise.all(channelsNames
    .map(channelName => app.channel(channelName) as ExtendedChannel)
    .map(async(channel) => {
      if (!channel.ctx) return channel

      const omitter = await getOmitter(channel, access)

      return channel.send(omitter(record))
    }))
}
