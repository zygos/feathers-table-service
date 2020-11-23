import { snakeCase } from 'change-case'
import { Options } from './@types'

export default function safeCaseFactory({ doUseSnakeCase }: Options) {
  return (str: string | String, doOverwriteDot = false): string => {
    if (!doUseSnakeCase) return str.toString()

    if (!doOverwriteDot && str.includes('.')) {
      return str
        .split('.')
        .map(substring => snakeCase(substring))
        .join('.')
    }

    return snakeCase(str.toString())
  }
}
