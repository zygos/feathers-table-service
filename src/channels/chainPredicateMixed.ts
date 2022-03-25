import { HookContext } from '@feathersjs/feathers'
import { Predicate } from '../@types'

export default (predicate: Predicate, ctx: HookContext): boolean | Promise<boolean> => {
  if (typeof predicate !== 'function') return predicate

  return predicate(ctx)
}
