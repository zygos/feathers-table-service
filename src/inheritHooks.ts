import {
  GlobalHooks,
  HookMethod,
  HookMethods,
  HookType,
  HookTypeFinal,
  ServiceHooks,
} from './@types'
import { castArray } from './utils'

const hookTypes: HookType[] = ['before', 'after', 'error', 'finally']
const hookMethods: HookMethod[] = ['all', 'create', 'patch', 'update', 'remove', 'find', 'get']
const ALL_SET: HookMethod = 'allSet'
const ALL_GET: HookMethod = 'allGet'
const compoundHookMethodsKeys: HookMethod[] = [ALL_GET, ALL_SET]
const none: HookMethods = {}
const empty: Function[] = []
const methodCompounds = new Map([
  ['create', ALL_SET],
  ['find', ALL_GET],
  ['get', ALL_GET],
  ['patch', ALL_SET],
  ['update', ALL_SET],
])

const wrapArray = (array: Function | Function[] | undefined): Function[] => {
  if (typeof array === 'undefined') return empty

  return castArray(array)
}

export default function inheritHooks(extendedHooks: ServiceHooks, globalHooks: GlobalHooks) {
  return Object.fromEntries(hookTypes
    .map((hookType) => {
      const hooksOfType = extendedHooks[hookType] || none
      const hooksOfTypeGlobal = globalHooks[hookType] || none
      const hooksOfTypeGlobalFinal = (globalHooks[getHookTypeFinal(hookType)] || none)
      // const hookMethodsCustom = Object
      //   .keys(hooksOfType)
      //   .filter((key: any) => !hookMethods.includes(key))

      return [
        hookType,
        Object.fromEntries([
          ...hookMethods
            .filter(hookMethod => !compoundHookMethodsKeys.includes(hookMethod))
            .map((hookMethod) => {
              const compoundKey = methodCompounds.get(hookMethod)
              const hooksCompounded = getCompounded(hooksOfType, compoundKey)
              const hooksGlobalCompounded = getCompounded(hooksOfTypeGlobal, compoundKey)
              const hooksGlobalFinalCompounded = getCompounded(hooksOfTypeGlobalFinal, compoundKey)

              return [
                hookMethod,
                [
                  hooksGlobalCompounded, // global allSet
                  hooksOfTypeGlobal[hookMethod], // global create
                  hooksCompounded, // allSet
                  hooksOfType[hookMethod], // create
                  hooksGlobalFinalCompounded, // global allSetFinal
                  hooksOfTypeGlobalFinal[hookMethod], // global createFinal
                ].flatMap(array => wrapArray(array)),
              ]
            }),
          // ...hookMethodsCustom.map(key => [key, hooksOfType[key]]),
        ]),
      ]
    }))
}

function getHookTypeFinal(hookType: HookType): HookTypeFinal {
  if (hookType === 'before') return 'beforeFinal'
  if (hookType === 'after') return 'afterFinal'
  if (hookType === 'error') return 'errorFinal'

  return 'unknown'
}

function getCompounded(hookMethods: HookMethods, compoundKey?: HookMethod) {
  return compoundKey
    ? hookMethods[compoundKey] || empty
    : empty
}
