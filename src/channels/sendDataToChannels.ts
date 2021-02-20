import { ChannelWithContext, Predicate } from '../@types'
import { Application } from '@feathersjs/feathers'
import getOmitter from './getOmitter'

export default async function sendDataToChannels(
  app: Application,
  access: Record<string, Predicate>,
  channelsNames: string[],
  record: Record<string, unknown>,
) {
  if (!record) return []

  const channels = channelsNames
    .map(channelName => app.channel(channelName) as Required<ChannelWithContext>)

  if (!access) return channels

  return await Promise.all(channels
    .map(async(channel) => {
      if (!channel.ctx) return channel

      const omitter = await getOmitter(channel, access, record)

      return channel.send(omitter(record))
    }))
}
