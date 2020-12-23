import { HookContext } from '@feathersjs/feathers'
import hasSameUserId from './hasSameUserId'

function hasRole(role: string) {
  return (ctx: HookContext) => role === ctx.params?.user?.role
}

export const userAccess = {
  password: hasRole('ADMIN'),
  lastName: false,
}

export const fileAccess = {
  privateKey: hasRole('ADMIN'),
  userId: hasSameUserId,
}
