import { YamlLoaderOptions } from '@fiends-of-js/yaml-loader'
import * as webpack from '@webpack-contrib/test-utils'
import { expect } from 'chai'
import * as path from 'path'
import * as sinon from 'sinon'

function createConfig (options: Partial<YamlLoaderOptions> = {}) {
  return {
    context: __dirname,
    rules: [
      {
        test: /\.ya?ml$/,
        use: {
          loader: path.resolve(__dirname, '../src/index.ts'),
          options
        }
      }
    ]
  }
}

async function createTest (fixture: string, options: Partial<YamlLoaderOptions> = {}) {
  const config = createConfig(options)

  const stats = await webpack(`./fixtures/${fixture}.yaml`, config)
  const { source } = stats.toJson().modules[0]
  const { result } = await import(`./fixtures/${fixture}-result`)

  expect(source).to.be.equal(result)
}

describe('Loader', () => {
  context('without options', () => {
    it('should convert yaml to json', async () => {
      await createTest('without-options')
    })
  })

  context('with useNodeEnv option set to true', () => {
    context('rignt NODE_ENV', () => {
      it('should load only test part of file', async () => {
        await createTest('with-node-env-option', { useNodeEnv: true })
      })
    })

    context('undefined NODE_ENV', () => {
      it('should emit error', async () => {
        const sandbox = sinon.sandbox.create()
        const stub = sandbox.stub(process, 'env')
        stub.get(() => {
          return { NODE_ENV: undefined }
        })
        const config = createConfig({ useNodeEnv: true })

        const stats = await webpack('./fixtures/with-node-env-option.yaml', config)
        const { errors } = stats.toJson()
        sandbox.restore()
        expect(errors[0]).to.match(/You are using NODE_ENV for loading yaml files, but your NODE_ENV is undefined!/)
      })
    })

    context('invalid NODE_ENV', () => {
      it('should emit error', async () => {
        const sandbox = sinon.sandbox.create()
        const stub = sandbox.stub(process, 'env')
        stub.get(() => {
          return { NODE_ENV: 'invalid' }
        })
        const config = createConfig({ useNodeEnv: true })

        const stats = await webpack('./fixtures/with-node-env-option.yaml', config)
        const { errors } = stats.toJson()
        sandbox.restore()
        expect(errors[0]).to.match(/You are using NODE_ENV for loading yaml files, but no property "invalid" found in yaml file!/)
      })
    })
  })

  context('with transformKeysRecursive option', () => {
    context('object in yaml file', () => {
      it('should change keys by passed function', async () => {
        await createTest(
          'with-transform-keys-recursive-option',
          { transformKeysRecursive: key => `${key}-key` }
        )
      })
    })

    context('array in yaml file', () => {
      it('should change keys of objects by passed function', async () => {
        await createTest(
          'with-transform-keys-recursive-option-from-array',
          { transformKeysRecursive: key => `${key}-key` }
        )
      })
    })

    context('simple type in yaml file', () => {
      it('should change keys of objects by passed function', async () => {
        await createTest(
          'with-transform-keys-recursive-option-simple-type',
          { transformKeysRecursive: key => `${key}-key` }
        )
      })
    })
  })

  context('with transformValues option', () => {
    context('object in yaml file', () => {
      it('should change values by passed function', async () => {
        await createTest('with-transform-values-recursive-option', {
          transformValues: value => typeof value === 'string' ? `${value}-value` : value
        })
      })
    })

    context('array in yaml file', async () => {
      it('should change values by passed function', async () => {
        await createTest('with-transform-values-recursive-option-from-array', {
          transformValues: value => typeof value === 'string' ? `${value}-value` : value
        })
      })
    })

    context('simple type in yaml file', async () => {
      it('should change values by passed function', async () => {
        await createTest('with-transform-values-recursive-option-simple-type', {
          transformValues: value => typeof value === 'string' ? `${value} string` : value
        })
      })
    })
  })

  context('invalid yaml file', () => {
    it('should emit error', async () => {
      const config = createConfig()

      const stats = await webpack('./fixtures/invalid-yaml-file.yaml', config)
      const { errors } = stats.toJson()
      expect(errors[0]).to.match(/YAMLException: end of the stream or a document separator is expected/)
    })
  })

  describe('context tranform keys and values', () => {
    it('should change keys and values according to passed functions', async () => {
      await createTest('transform-keys-and-values', {
        transformKeysRecursive: key => `${key}-key`,
        transformValues: value => typeof value === 'number' ? value * 10 : value
      })
    })
  })
})
