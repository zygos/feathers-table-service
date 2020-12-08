import { ExtendedChannel, Predicate } from '../@types'
import { Application } from '@feathersjs/feathers'
import getOmitter from './getOmitter'

export default async function sendDataToChannels(app: Application, access: Record<string, Predicate>, channelsNames: string[], record: Record<string, any>) {
  const channels = channelsNames
    .map(channelName => app.channel(channelName))
  return Promise.all(channels
    .map(async(channel: ExtendedChannel) => {
      if (!channel.ctx || !record) return channel

      const currentOmitter = await getOmitter(channel, access)

      return channel.send(currentOmitter(record))
    }))
}
