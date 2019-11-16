import { TableFields, ValidateOptions } from './@types'

export default function buildJsonSchema(fields: TableFields, options: ValidateOptions) {
  const properties: { [key: string]: any } = {}

  for (const key in fields) {
    const staticField = typeof fields[key] === 'function'
      ? fields[key]()
      : fields[key]

    if (staticField.validate) {
      properties[key] = {...staticField.validate }

      if (options.inheritNullable && staticField.nullable) {
        properties[key].nullable = staticField.nullable
      }
    }
  }

  const required = Object
    .keys(fields)
    .filter(fieldName => fields[fieldName].required)

  return { properties, required }
}
