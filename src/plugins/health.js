'use strict'

const { HealthCheck } = require('@mojaloop/central-services-shared').HealthCheck
const { defaultHealthHandler } = require('@mojaloop/central-services-health')
const { getSubServiceHealthDatastore, getSubServiceHealthBroker } = require('../lib/healthCheck/subServiceHealth')
const packageJson = require('../../package.json')

let healthCheck

const createHealthCheck = ({ }) => {
  return new HealthCheck(packageJson, [
    () => getSubServiceHealthDatastore(),
    () => getSubServiceHealthBroker()
  ])
}

const handler = {
  get: (request, reply) => {
    healthCheck = healthCheck || createHealthCheck({})
    return defaultHealthHandler(healthCheck)(request, reply)
  }
}

const routes = [
  {
    method: 'GET',
    path: '/health',
    handler: handler.get
  }
]

const plugin = {
  name: 'Health',
  register (server) {
    server.route(routes)
  }
}

module.exports = {
  plugin,
  handler,
  createHealthCheck
}
