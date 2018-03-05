import * as isPlainObject from 'is-plain-object'
import * as Yaml from 'js-yaml'
import { getOptions } from 'loader-utils'
import { loader } from 'webpack'

export interface YamlLoaderOptions {
  transformValues?: (value: any) => any,
  transformKeysRecursive?: (key: string) => string,
  useNodeEnv?: boolean
}

function transformKeysRecursive (entity: object, callback: (key: string) => string): object {
  if (Array.isArray(entity)) {
    return entity.map((item: any) => transformKeysRecursive(item, callback))
  }

  if (!isPlainObject(entity)) return entity

  const result: { [index: string]: any } = {}
  Object.entries(entity).forEach(([key, value]) => {
    result[callback(key)] = isPlainObject(value) ? transformKeysRecursive(value, callback) : value
  })

  return result
}

function shallowTransformValues (entity: object, callback: (value: any) => any): object {
  if (Array.isArray(entity)) {
    return entity.map((item: any) => callback(item))
  }

  if (!isPlainObject(entity)) return callback(entity)

  const result: { [index: string]: any } = {}
  Object.entries(entity).forEach(([key, value]) => {
    result[key] = callback(value)
  })

  return result
}

export default function yamlLoader (this: loader.LoaderContext, source: string): string | undefined {
  const filename: string = this.resourcePath
  const {
    useNodeEnv = false,
    transformKeysRecursive: transformKeys,
    transformValues
  }: YamlLoaderOptions = getOptions(this) as any

  try {
    const yamlFileContent: any = Yaml.safeLoad(source, { filename })

    if (useNodeEnv && process.env.NODE_ENV === undefined) {
      throw new Error(`You are using NODE_ENV for loading yaml files, but your NODE_ENV is undefined!`)
    }

    if (useNodeEnv && !yamlFileContent.hasOwnProperty(process.env.NODE_ENV)) {
      throw new Error(`You are using NODE_ENV for loading yaml files, but no property "${process.env.NODE_ENV}" found in yaml file!`)
    }

    const result: object = useNodeEnv ? yamlFileContent[process.env.NODE_ENV as string] : yamlFileContent
    let normalized: any = result

    if (transformKeys) {
      normalized = transformKeysRecursive(result, transformKeys)
    }

    if (transformValues) {
      normalized = shallowTransformValues(result, transformValues)
    }

    return `exports.default = ${JSON.stringify(normalized)};`
  } catch (exception) {
    this.emitError(exception)
    return `exports.default = ${JSON.stringify({
      exception,
      filename,
      error: exception.message
    })}`
  }
}
