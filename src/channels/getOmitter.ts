import { omit } from 'rambda'
import { ExtendedChannel } from '../@types'
import getFieldsToOmit from './getFieldsToOmit'

export default async function getOmitter(channel:ExtendedChannel, access:any) {

  if (!channel.omitters) channel.omitters = new Map()

  const currentOmitter = channel.omitters.get(access)

  if (currentOmitter) return currentOmitter

  if (!channel.ctx) throw Error('Channel context is undefined')

  const fieldsToOmit = await getFieldsToOmit(access, channel.ctx)
  const omitter = omit(fieldsToOmit)
  channel.omitters.set(access, omitter)
  return omitter
}
