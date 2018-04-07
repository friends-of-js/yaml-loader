import * as isPlainObject from 'is-plain-object'
import * as Yaml from 'js-yaml'
import { getOptions } from 'loader-utils'
import { loader } from 'webpack'

export interface YamlLoaderOptions {
  useNodeEnv?: boolean

  transformValues? (value: any): any,

  transformKeysRecursive? (key: string): string,
}

function transformKeysRecursive (entity: object, callback: (key: string) => string): object {
  if (Array.isArray(entity)) {
    return entity.map((item: any) => transformKeysRecursive(item, callback))
  }

  if (!isPlainObject(entity)) return entity

  const result: { [index: string]: any } = {}
  Object.entries(entity).forEach(([key, value]) => {
    result[callback(key)] = transformKeysRecursive(value, callback)
  })

  return result
}

function shallowTransformValues (entity: object, callback: (value: any) => any): object {
  if (Array.isArray(entity)) {
    return entity.map(callback)
  }

  if (!isPlainObject(entity)) return callback(entity)

  const result: { [index: string]: any } = {}
  Object.entries(entity).forEach(([key, value]) => {
    result[key] = callback(value)
  })

  return result
}

function transform (
  input: object,
  transformKeys?: (key: string) => string,
  transformValues?: (value: any) => any
) {
  let result = input

  if (transformKeys) {
    result = transformKeysRecursive(result, transformKeys)
  }

  if (transformValues) {
    result = shallowTransformValues(result, transformValues)
  }

  return result
}

// tslint:disable:no-flag-args
function checkNodeEnv (useNodeEnv: boolean, yamlFileContent: any) {
  if (!useNodeEnv) return

  if (process.env.NODE_ENV === undefined) {
    throw new Error('You are using NODE_ENV for loading yaml files, but your NODE_ENV is undefined!')
  }

  if (yamlFileContent.hasOwnProperty(process.env.NODE_ENV)) return

  throw new Error(
    `You are using NODE_ENV for loading yaml files, but no property "${process.env.NODE_ENV}" found in yaml file!`
  )
}
// tslint:enable:no-flag-args

// tslint:disable:max-func-body-length
export default function yamlLoader (this: loader.LoaderContext, source: string): string | undefined {
  const filename = this.resourcePath
  const {
    useNodeEnv = false,
    transformKeysRecursive: transformKeys,
    transformValues
  }: YamlLoaderOptions = getOptions(this)

  try {
    const yamlFileContent: any = Yaml.safeLoad(source, { filename })

    checkNodeEnv(useNodeEnv, yamlFileContent)

    let result: object = useNodeEnv ? yamlFileContent[process.env.NODE_ENV as string] : yamlFileContent

    result = transform(result, transformKeys, transformValues)

    return `module.exports = ${JSON.stringify(result)};`
  } catch (exception) {
    this.emitError(exception)

    return `module.exports = ${JSON.stringify({ exception, filename, error: exception.message })}`
  }
}
// tslint:enable:max-func-body-length
