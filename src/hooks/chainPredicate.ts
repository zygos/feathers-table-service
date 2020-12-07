import { HookContext } from '@feathersjs/feathers'
import { Predicate } from '../@types'

export default async(predicate: Predicate, ctx: HookContext): Promise<boolean> => {
  if (typeof predicate !== 'function') return predicate

  return predicate(ctx)
}
