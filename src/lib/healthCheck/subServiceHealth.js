'use strict'

const { statusEnum, serviceName } = require('@mojaloop/central-services-shared').HealthCheck.HealthCheckEnums
const { logger } = require('../../shared/logger')
const Consumer = require('@mojaloop/central-services-stream').Util.Consumer
const { MongoDBService } = require('../../services/mongo-db.service')

/**
 * @function getSubServiceHealthDatastore
 *
 * @description Checks the health of the MongoDB datastore by issuing a ping command using the existing MongoDBService connection.
 * If the ping is successful, the status is set to OK; otherwise, it is set to DOWN.
 *
 * @param {MongoDBService} mongoDBService - The existing MongoDBService instance.
 * @returns {Promise<{name: string, status: string}>} The SubService health object for the datastore.
 */
const getSubServiceHealthDatastore = async (mongoDBService) => {
  let status = statusEnum.OK

  try {
    if (!mongoDBService) {
      logger.warn('MongoDBService instance is not provided.')
      status = statusEnum.DOWN
    } else {
      const healthy = await mongoDBService.healthCheck()
      if (!healthy) {
        logger.warn('MongoDB health check failed.')
        status = statusEnum.DOWN
      }
    }
  } catch (err) {
    logger.error(`Error in getSubServiceHealthDatastore: ${err?.message}`, err)
    status = statusEnum.DOWN
  }

  return {
    name: serviceName.datastore,
    status
  }
}

/**
 * @function getSubServiceHealthBroker
 *
 * @description Gets the health for the Notification broker
 * @returns Promise<object> The SubService health object for the broker
 */
const getSubServiceHealthBroker = async () => {
  let status = statusEnum.OK

  try {
    const consumerTopics = Consumer.getListOfTopics()
    const results = await Promise.all(
      consumerTopics.map(async (t) => {
        try {
          return await Consumer.allConnected(t)
        } catch (err) {
          logger.isWarnEnabled && logger.warn(`allConnected threw for topic ${t}: ${err.message}`)
          return false
        }
      })
    )

    if (results.some(connected => !connected)) {
      status = statusEnum.DOWN
    }
  } catch (err) {
    logger.isWarnEnabled && logger.warn(`getSubServiceHealthBroker failed with error ${err.message}.`)
    status = statusEnum.DOWN
  }

  return {
    name: serviceName.broker,
    status
  }
}

module.exports = {
  getSubServiceHealthDatastore,
  getSubServiceHealthBroker
}
