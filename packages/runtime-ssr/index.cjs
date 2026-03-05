if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/index.cjs-prod.cjs')
} else {
  module.exports = require('./dist/index.cjs-dev.cjs')
}
