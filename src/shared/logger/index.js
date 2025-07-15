const { loggerFactory } = require('@mojaloop/central-services-logger/src/contextLogger')

const logger = loggerFactory('REP') // global logger

module.exports = {
  logger
}
