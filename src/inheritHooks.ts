import { ServiceHooks, HookMethod, HookType } from './@types'
import { castArray } from './utils'

export default function inheritHooks(extendedHooks: ServiceHooks) {
  const hooks = { ...extendedHooks }

  // prepend allSet & allGet hooks
  const hookTypes: HookType[] = ['before', 'after', 'error']
  const compoundHookMethods: { [key in HookMethod]?: Array<HookMethod> } = {
    allSet: ['create', 'patch', 'update'],
    allGet: ['find', 'get'],
  }

  hookTypes.forEach((type: HookType) => {
    if (typeof hooks[type] === 'undefined') hooks[type] = {}

    ;(Object.keys(compoundHookMethods) as HookMethod[])
      .filter((compoundKey: HookMethod) => hooks[type]![compoundKey])
      .forEach((compoundKey) => {
        compoundHookMethods[compoundKey]!.forEach((method: HookMethod) => {
          hooks[type]![method] = [
            ...castArray(hooks[type]![compoundKey]),
            ...castArray(hooks[type]![method] || []),
          ]
        })

        delete hooks[type]![compoundKey]
      })
  })

  return hooks
}
