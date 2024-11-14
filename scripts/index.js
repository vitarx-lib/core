import * as transformer from './transformer.js'

for (let transformerKey in transformer) {
  transformer[transformerKey]()
}
