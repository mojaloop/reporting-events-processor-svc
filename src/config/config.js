function initConfig () {
  const result = require('dotenv').config()

  if (result.error) {
    throw result.error
  }

  console.log('Config Loaded: ', result.parsed)
}

module.exports = { initConfig }
