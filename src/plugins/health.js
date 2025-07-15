'use strict'

const { HealthCheck } = require('@mojaloop/central-services-shared').HealthCheck
const { defaultHealthHandler } = require('@mojaloop/central-services-health')
const { getSubServiceHealthDatastore, getSubServiceHealthBroker } = require('../lib/healthCheck/subServiceHealth')
const packageJson = require('../../package.json')

let healthCheck

const createHealthCheck = ({ mongoDBService }) => {
  return new HealthCheck(packageJson, [
    () => getSubServiceHealthDatastore(mongoDBService),
    () => getSubServiceHealthBroker()
  ])
}

const handler = {
  get: (mongoDBService) => (request, reply) => {
    healthCheck = healthCheck || createHealthCheck({ mongoDBService })
    return defaultHealthHandler(healthCheck)(request, reply)
  }
}

const plugin = {
  name: 'Health',
  register (server, options) {
    server.route([{
      method: 'GET',
      path: '/health',
      handler: handler.get(options.mongoDBService)
    }])
  }
}

module.exports = {
  plugin,
  handler,
  createHealthCheck
}
