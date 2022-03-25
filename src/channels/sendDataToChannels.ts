import { ChannelWithContext, Predicate } from '../@types'
import { Application } from '@feathersjs/feathers'
import getChannelFieldsToOmit from './getChannelFieldsToOmit'
import { omit } from 'rambda'

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

  const accessEntries = Object.entries(access)

  if (!accessEntries.length) return channels

  return await Promise.all(channels
    .map(async(channel) => {
      try {
        // TODO: investigate cases when channel ctx is missing
        if (!channel.ctx) return channel

        const fieldsToOmit = await getChannelFieldsToOmit(channel, accessEntries, record)

        // TODO: cache same fieldsToOmit
        return fieldsToOmit.length
          ? channel.send(omit(fieldsToOmit, record))
          : channel.send(record)
      } catch (error) {
        const logger = app.get('logger')

        if (logger) logger.error(error)

        throw error
      }
    }))
}
