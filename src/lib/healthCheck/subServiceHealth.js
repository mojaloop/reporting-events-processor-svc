'use strict'

const { statusEnum, serviceName } = require('@mojaloop/central-services-shared').HealthCheck.HealthCheckEnums
const { logger } = require('../../shared/logger')
const Consumer = require('@mojaloop/central-services-stream').Util.Consumer
const { MongoDBService } = require('../../services/mongo-db.service')

/**
 * @function getSubServiceHealthDatastore
 *
 * @description Gets the health of the Datastore by ensuring the table is currently locked
 * in a migration state. This implicity checks the connection with the database.
 *
 * @returns Promise<SubServiceHealth> The SubService health object for the datastore
 */
const mongoDbURI = process.env.MONGO_DB_URI

const getSubServiceHealthDatastore = async () => {
  let status = statusEnum.OK
  const mongoService = new MongoDBService(mongoDbURI)

  try {
    const initialized = await mongoService.initialize()
    if (!initialized) {
      status = statusEnum.DOWN
    }
  } catch (err) {
    logger.warn(`error in getSubServiceHealthDatastore: ${err?.message}`, err)
    status = statusEnum.DOWN
  } finally {
    await mongoService.close()
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
