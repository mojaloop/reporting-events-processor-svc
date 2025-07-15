const { MongoClient } = require('mongodb')
const Config = require('../lib/config')
const { createReportingSchema, applySchema } = require('../utilities/mongodb-schema')
const { logger } = require('../shared/logger')

class MongoDBService {
  constructor (mongoDbURI) {
    this.initialized = false
    this.mongoDBConnectionString = mongoDbURI || 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000'
    this.saveClient = false
  }

  async initialize () {
    let result = false
    const mongo = new MongoClient(this.mongoDBConnectionString)
    try {
      await mongo.connect()

      const res = await mongo.db().command({ ping: 1 })

      if (res.ok === 1) {
        logger.info('Connected to Mongo DB')
        result = true

        const collections = await mongo.db().listCollections().toArray()
        if (!collections.find(col => col.name === Config.EVENT_STORE_DB.EVENTS_COLLECTION)) {
          await createReportingSchema(mongo, Config.EVENT_STORE_DB.EVENTS_COLLECTION)
          logger.info('Set up Mongo DB Datasets & Schema')
        } else if (Config.EVENT_STORE_DB.APPLY_SCHEMA) {
          await applySchema(mongo, Config.EVENT_STORE_DB.EVENTS_COLLECTION)
          logger.info('Applying Mongo DB Reporting Schema')
        }
      }
    } catch (err) {
      const message = 'Failed to initialize MongoDB Service: '
      logger.error(message, err)
    } finally {
      await mongo.close()
    }

    if (!result) {
      const message = 'Could not initialize MongoDB Service'
      logger.error(message)
    }

    return (this.initialized = result)
  }

  async saveToDB (records) {
    if (!this.saveClient) {
      this.saveClient = new MongoClient(this.mongoDBConnectionString)
      await this.saveClient.connect()
    }
    let result = false
    try {
      const collection = await this.saveClient.db().collection(Config.EVENT_STORE_DB.EVENTS_COLLECTION)

      await collection.insertMany(records)
      logger.info(`Inserted ${records.length} records into MongoDB`)
      result = true
    } catch (error) {
      logger.error(`Error while attempting to save to MongoDB: ${error.message}`, error)
      const newErr = new Error(`Error while attempting to save to MongoDB: ${error.message}\nRecord:\n${JSON.stringify(records)}\n`)
      newErr.origin = error

      throw newErr
    }
    return result
  }

  async close() {
    if (this.saveClient) {
      try {
        await this.saveClient.close()
      } finally {
        this.saveClient = false
      }
    }
  }

  async healthCheck() {
    let mongo
    try {
      mongo = new MongoClient(this.mongoDBConnectionString)
      await mongo.connect()
      const res = await mongo.db().command({ ping: 1 })
      return res.ok === 1
    } catch (err) {
      logger.error('MongoDB health check failed:', err)
      return false
    } finally {
      if (mongo) {
        await mongo.close()
      }
    }
  }
}

module.exports = { MongoDBService }
