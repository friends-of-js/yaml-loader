# Yaml loader for webpack

> Webpack loader for yaml format with support of NODE_ENV and ability to change keys and values of yaml objects in compile time

## Install

```bash
npm install --save-dev @friends-of-js/yaml-loader
```

## Usage

**webpack.config.js**
```javascript

module.exports = {
  module: {
    rules: [
      {
        test: /\.ya?ml$/,
        use: [
          {
            loader: '@friends-of-js/yaml-loader',
          }
        ]
      }
    ]
  }
}
```
Then in your code:
```javascript
import content from './path/to/yaml-file.yaml'
```

Yaml loader provide only default export of all yaml content.

## Options

|Name|Type|Default|Description|
|:--:|:--:|:-----:|:----------|
|**`useNodeEnv`**|`boolean`|`false`|If true - load only part of yaml file that corresponds to current NODE_ENV|
|**`transformKeysRecursive`**|`(key: string) => string`|`undefined`|Function for recursive change object keys|
|**`transformValues`**|`(value: any) => any`|`undefined`|Function for shallow change values of yaml file|

### `useNodeEnv`

If `useNodeEnv` set to `true` - yaml-loader try to load part of file that corrensonds to current NODE_ENV.

**example.yaml**
```yaml
production:
  API_KEY: 123456

TEST:
  API_KEY: 654321
```

**webpack.config.js**
```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.ya?ml$/,
        use: [
          {
            loader: '@friends-of-js/yaml-loader',
            options: { useNodeEnv: true }
          }
        ]
      }
    ]
  }
}
```

So if your NODE_ENV = 'test' - yaml loader would create bundle with this content: 
```javascript
module.exports = { "API_KEY":654321 };
```

### `transformKeysRecursive`

You can pass function to `transformKeysRecursive`. It would recursively change all keys in **objects**

**example.yaml**
```yaml
first_key: 1
second_key: 2
third_key:
  - object_key: value
```

**webpack.config.js**
```javascript

function capitalize (word) {
  return `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`
}

function camelize (text, separator = '_') {
  const words = text.split(separator)
  return [words[0], words.slice(1).map((word) => capitalize(word))].join('')
}

module.exports = {
  module: {
    rules: [
      {
        test: /\.ya?ml$/,
        use: [
          {
            loader: '@friends-of-js/yaml-loader',
            options: {
              transformKeysRecursive: camelize
            }
          }
        ]
      }
    ]
  }
}
```
It would produce this object:
```javascript
module.exports = {
  firstKey: 1,
  secondKey: 2,
  thirdKey: [
    { objectKey: 'value'}
  ]
}
```
As you can see, keys in object inside array are also changed.

### `transformValues`

You can pass function to `transformValues`. It would change values of yaml content, but this function is **not recursive**.


**example1.yaml**
```yaml
first_key: 1
second_key: 2
```

**example2.yaml**
```yaml
string content of file
```

**webpack.config.js**
```javascript

module.exports = {
  module: {
    rules: [
      {
        test: /\.ya?ml$/,
        use: [
          {
            loader: '@friends-of-js/yaml-loader',
            options: {
              tranformValues: (value) => typeof value === 'number' ? value + 10 : `this is `${value}`
            }
          }
        ]
      }
    ]
  }
}
```
It would produce this object for example1.yaml:
```javascript
module.exports = { first_key: 11, second_key: 12 }
```

And this content for example2.yaml:
```javascript
module.exports = 'this is string content of file'
```
