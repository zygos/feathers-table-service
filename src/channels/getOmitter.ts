import { omit } from 'rambda'
import { ChannelWithContext, Predicate } from '../@types'
import getFieldsToOmit from './getFieldsToOmit'

export default async function getOmitter(
  channel: Required<ChannelWithContext>,
  access: Record<string, Predicate>,
  record: Record<string, unknown>,
) {
  const contextWithRecord = { ...channel.ctx, result: record }
  const fieldsToOmit = await getFieldsToOmit(access, contextWithRecord)
  return omit(fieldsToOmit)
}
