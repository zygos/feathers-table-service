const patterns: { [key: string]: any } = {
  address: /^[\p{L}\s\d\+-\/`'"\(\)]*$/u,
  commonString: /^[\p{L}\s\d\+-/`'"\(\)]*$/u,
  name: /^[\w'\-,.]*[^0-9_!¡?÷?¿/\\+=@#$%ˆ&*(){}|~<>;:[\]]{2,}$/,
  password: /^[\w-!@#$%^&*=+~,.;()]*$/,
  phoneNumber: /^[+\-\(\) 0-9]*$/,
  slug: /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/,
}
const stringPatterns: { [key: string]: any } = Object
  .keys(patterns)
  .reduce((acc, key) => ({
    [key]: patterns[key].source.replace('\\', '\\\\'),
    ...acc,
  }), {})

export const INTEGER_MIN = -2147483647
export const INTEGER_MAX = 2147483647
export const PRICE_MAX = 100000000
export const SMALLINT_MAX = 32767
export const STRING_MAX = 65536

function definePreset(type: string, template: object = {}) {
  const typeTemplate: { [key: string]: any } = {
    type,
    ...template,
  }

  return (overwrites: { [key: string]: any } = {}) => {
    const fieldTemplate = { ...typeTemplate }
    const { validate, ...otherOverwrites } = overwrites

    if (validate) {
      // if validate.type is present - overwrite entire validation
      // otherwise, only patch the exisitng one for the given field
      if (validate.type) {
        fieldTemplate.validate = validate
      } else {
        Object.assign(fieldTemplate, {
          validate: {
            ...fieldTemplate.validate,
            ...validate,
          },
        })
      }
    }

    Object.assign(fieldTemplate, otherOverwrites)

    return fieldTemplate
  }
}

export const ADDRESS = definePreset('string', {
  validate: {
    type: 'string',
    maxLength: 92,
    pattern: stringPatterns.address,
  },
})

export const BOOL = definePreset('boolean', {
  validate: {
    type: 'boolean',
  },
})

export const BOOLEAN = BOOL

export const DATE = definePreset('date', {
  validate: {
    format: 'date',
    maxLength: 48,
  },
})

export const DECIMAL = definePreset('decimal', {
  validate: {
    type: 'number',
    minimum: 0,
    maximum: INTEGER_MAX,
  },
})

export const FLOAT = definePreset('float', {
  validate: {
    type: 'number',
    minimum: INTEGER_MIN,
    maximum: INTEGER_MAX,
  },
})

export const EMAIL = definePreset('string', {
  validate: {
    type: 'string',
    format: 'email',
    minLength: 5,
    maxLength: 200,
  },
})

export const FULL_NAME = definePreset('string', {
  validate: {
    type: 'string',
    minLength: 1,
    maxLength: 80,
    pattern: stringPatterns.commonString,
  },
})

export const JSONB = definePreset('jsonb', {
  defaultTo: '{}',
  validate: {
    type: 'object',
    maxProperties: 500,
  },
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
  validate: {
    type: 'integer',
    minimum: 1,
    maximum: INTEGER_MAX,
  },
})

export const INCREMENTS_PRIMARY = definePreset('increments', {
  primary: true,
  validate: {
    type: 'integer',
    minimum: 1,
    maximum: INTEGER_MAX,
  },
})

export const ID = definePreset('integer', {
  validate: {
    type: 'integer',
    minimum: 1,
    maximum: INTEGER_MAX,
  },
})

export const INTEGER = definePreset('integer', {
  validate: {
    type: 'integer',
    minimum: INTEGER_MIN,
    maximum: INTEGER_MAX,
  },
})

export const INTEGER_ARRAY = definePreset('integer[]', {
  defaultTo: '{}',
  validate: {
    type: 'array',
    maxItems: 100,
    items: {
      type: 'integer',
      integer: true,
      minimum: INTEGER_MIN,
      maximum: INTEGER_MAX,
    },
  },
})

export const PASSWORD = definePreset('string', {
  validate: {
    type: 'string',
    minLength: 8,
    maxLength: 64,
    pattern: stringPatterns.password,
  },
})

export const STRING_ARRAY = definePreset('text[]', {
  defaultTo: '{}',
  validate: {
    type: 'array',
    maxItems: 100,
    items: {
      type: 'string',
      maxLength: STRING_MAX,
    },
  },
})

export const NAME = definePreset('string', {
  validate: {
    type: 'string',
    maxLength: 48,
    pattern: stringPatterns.name,
  },
})

export const NUMERIC = definePreset('numeric', {
  validate: {
    type: 'integer',
    minimum: 0,
    maximum: INTEGER_MAX,
  },
})

export const PERCENT = definePreset('float', {
  validate: {
    type: 'number',
    minimum: 0,
    maximum: 100,
  },
})

export const PHONE_NUMBER = definePreset('string', {
  validate: {
    type: 'string',
    maxLength: 32,
    pattern: stringPatterns.phoneNumber,
  },
})

export const PRICE = definePreset('decimal', {
  validate: {
    type: 'number',
    minimum: 0,
    maximuim: PRICE_MAX,
  },
})

export const SLUG = definePreset('string', {
  validate: {
    type: 'string',
    maxLength: 200,
    pattern: stringPatterns.slug,
  },
})

export const SMALL_INT = definePreset('smallint', {
  validate: {
    type: 'integer',
    minimum: 0,
    maximum: SMALLINT_MAX,
  },
})

export const STRING = definePreset('string', {
  validate: {
    type: 'string',
    maxLength: 256,
  },
})

export const STRING_ID = definePreset('string', {
  validate: {
    type: 'string',
    maxLength: 128,
  },
})

export const HOSTNAME = definePreset('string', {
  validate: {
    type: 'string',
    format: 'hostname',
    maxLength: 256,
  },
})

export const IP_V4 = definePreset('string', {
  validate: {
    type: 'string',
    format: 'ipv4',
    maxLength: 256,
  },
})

export const IP_V6 = definePreset('string', {
  validate: {
    type: 'string',
    format: 'ipv6',
    maxLength: 256,
  },
})

export const URI = definePreset('string', {
  validate: {
    type: 'string',
    format: 'uri',
    maxLength: 2000,
  },
})

export const UUID = definePreset('string', {
  validate: {
    type: 'string',
    format: 'uuid',
    minLength: 30,
    maxLength: 40,
  },
})

export const TEXT = definePreset('text', {
  validate: {
    type: 'string',
    maxLength: STRING_MAX,
  },
})

export const TIMESTAMP = definePreset('timestamp', {
  validate: {
    format: 'date-time',
    maxLength: 64,
  },
})
