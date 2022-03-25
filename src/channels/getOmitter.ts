import { omit } from 'rambda'
import { ChannelWithContext, Predicate } from '../@types'
import getFieldsToOmit from './getFieldsToOmit'

export default async function getOmitter(
  channel: Required<ChannelWithContext>,
  accessEntries: [string, Predicate][],
  record: Record<string, unknown>,
) {
  const contextWithRecord = {
    ...channel.ctx,
    result: record,
  }
  const fieldsToOmit = await getFieldsToOmit(accessEntries, contextWithRecord)
  return omit(fieldsToOmit)
}
