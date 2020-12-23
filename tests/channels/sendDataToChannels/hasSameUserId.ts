import { HookContext } from '@feathersjs/feathers'

export default function hasSameUserId(ctx: HookContext): boolean {
  const userId = ctx.params?.user?.id

  return ctx.result.userId === userId
}
