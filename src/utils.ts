export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function castArray(possiblyArray: any) {
  return Array.isArray(possiblyArray) ? possiblyArray : [possiblyArray]
}

export function isPlainObject(object: any) {
  return typeof object === 'object' &&
    object &&
    Object.prototype.toString.call(object) === '[object Object]'
}

export function uncastArray(element: any) {
  if (!Array.isArray(element)) return element

  return (element.length === 1) ? element[0] : element
}

export function maybeCall(method: unknown, methodArguments: unknown[] = []) {
  return typeof method === 'function' ? method(...methodArguments) : method
}
