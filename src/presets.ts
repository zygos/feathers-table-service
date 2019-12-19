const patterns: { [key: string]: any } = {
  name: /^[\w'\-,.]*[^0-9_!¡?÷?¿/\\+=@#$%ˆ&*(){}|~<>;:[\]]{2,}$/,
  password: /^[\w-!@#$%/^&*=+~,.;()]*$/,
  phoneNumber: /^[+\-\(\) 0-9]*$/,
  slug: /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/,
}
const stringPatterns: { [key: string]: any } = Object
  .keys(patterns)
  .reduce((acc, key) => ({
    ...acc,
    [key]: patterns[key].source.replace(/\\/g, '\\'),
  }), {})

export const INTEGER_MIN = -2147483647
export const INTEGER_MAX = 2147483647
export const PRICE_MAX = 100000000
export const SMALLINT_MAX = 32767
export const STRING_MAX = 65536

export function definePreset(knexType: string, template: object = {}) {
  const typeTemplate: { [key: string]: any } = {
    knexType,
    nullable: true,
    ...template,
  }

  return (overwrites: { [key: string]: any } = {}) => ({
    ...typeTemplate,
    ...(overwrites || {}),
  })
}

export const ADDRESS = definePreset('string', {
  type: 'string',
  maxLength: 255,
  minLength: 2,
})

export const BOOL = definePreset('boolean', {
  type: 'boolean',
})

export const BOOLEAN = BOOL

export const DATE = definePreset('date', {
  anyOf: [
    {
      format: 'date',
      maxLength: 48,
    },
    {
      format: 'date-time',
      maxLength: 48,
    },
  ],
})

export const DECIMAL = definePreset('decimal', {
  type: 'number',
  minimum: 0,
  maximum: INTEGER_MAX,
})

export const FLOAT = definePreset('float', {
  type: 'number',
  minimum: INTEGER_MIN,
  maximum: INTEGER_MAX,
})

export const EMAIL = definePreset('string', {
  type: 'string',
  format: 'email',
  minLength: 5,
  maxLength: 200,
})

export const FULL_NAME = definePreset('string', {
  type: 'string',
  minLength: 1,
  maxLength: 80,
})

export const JSONB = definePreset('jsonb', {
  defaultTo: '{}',

  type: 'object',
  maxProperties: 500,

  transform(value: any) {
    if (typeof value !== 'object' ||
      value === null ||
      Array.isArray(value)) {
      return {}
    }

    return value
  },
})

export const INCREMENTS = definePreset('increments', {
  type: 'integer',
  minimum: 1,
  maximum: INTEGER_MAX,
})

export const INCREMENTS_PRIMARY = definePreset('increments', {
  primary: true,

  type: 'integer',
  minimum: 1,
  maximum: INTEGER_MAX,
})

export const ID = definePreset('integer', {
  type: 'integer',
  minimum: 1,
  maximum: INTEGER_MAX,
})

export const INTEGER = definePreset('integer', {
  type: 'integer',
  minimum: INTEGER_MIN,
  maximum: INTEGER_MAX,
})

export const INTEGER_ARRAY = definePreset('integer[]', {
  defaultTo: '{}',

  type: 'array',
  maxItems: 100,
  items: {
    type: 'integer',
    integer: true,
    minimum: INTEGER_MIN,
    maximum: INTEGER_MAX,
  },
})

export const PASSWORD = definePreset('string', {
  type: 'string',
  minLength: 8,
  maxLength: 64,
  pattern: stringPatterns.password,
})

export const STRING_ARRAY = definePreset('text[]', {
  defaultTo: '{}',

  type: 'array',
  maxItems: 100,
  items: {
    type: 'string',
    maxLength: STRING_MAX,
  },
})

export const NAME = definePreset('string', {
  type: 'string',
  maxLength: 80,
  pattern: stringPatterns.name,
})

export const NUMERIC = definePreset('numeric', {
  type: 'integer',
  minimum: 0,
  maximum: INTEGER_MAX,
})

export const PERCENT = definePreset('float', {
  type: 'number',
  minimum: 0,
  maximum: 100,
})

export const PHONE_NUMBER = definePreset('string', {
  type: 'string',
  maxLength: 32,
  pattern: stringPatterns.phoneNumber,
})

export const PRICE = definePreset('decimal', {
  type: 'number',
  minimum: 0,
  maximuim: PRICE_MAX,
})

export const SLUG = definePreset('string', {
  type: 'string',
  maxLength: 200,
  pattern: stringPatterns.slug,
})

export const SMALL_INT = definePreset('smallint', {
  type: 'integer',
  minimum: 0,
  maximum: SMALLINT_MAX,
})

export const STRING = definePreset('string', {
  type: 'string',
  maxLength: 256,
})

export const STRING_ID = definePreset('string', {
  type: 'string',
  maxLength: 128,
})

export const HOSTNAME = definePreset('string', {
  type: 'string',
  format: 'hostname',
  maxLength: 256,
})

export const IP_V4 = definePreset('string', {
  type: 'string',
  format: 'ipv4',
  maxLength: 256,
})

export const IP_V6 = definePreset('string', {
  type: 'string',
  format: 'ipv6',
  maxLength: 256,
})

export const URI = definePreset('string', {
  type: 'string',
  format: 'uri',
  maxLength: 2000,
})

export const UUID = definePreset('string', {
  type: 'string',
  format: 'uuid',
  minLength: 30,
  maxLength: 40,
})

export const TEXT = definePreset('text', {
  type: 'string',
  maxLength: STRING_MAX,
})

export const TIMESTAMP = definePreset('timestamp', {
  format: 'date-time',
  maxLength: 64,
})
