import { ChannelWithContext, Predicate } from '../@types'
import getFieldsToOmit from './getFieldsToOmit'

export default function getChannelFieldsToOmit(
  channel: Required<ChannelWithContext>,
  accessEntries: [string, Predicate][],
  record: Record<string, unknown>,
) {
  const contextWithRecord = {
    ...channel.ctx,
    result: record,
  }

  return getFieldsToOmit(accessEntries, contextWithRecord)
}
