const { MongoClient } = require('mongodb')
const Config = require('../lib/config')
const { createReportingSchema, applySchema } = require('../utilities/mongodb-schema')
const { logger } = require('../shared/logger')

class MongoDBService {
  constructor (mongoDbURI, mongoDBServiceOptions = {}) {
    this.mongoDBConnectionString = mongoDbURI || 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000'
    this.mongoDBServiceOptions = mongoDBServiceOptions
    this.initialized = false
    this.mongoClient = null
    this.log = logger.child({ component: this.constructor.name })
  }

  async initialize () {
    let result = false
    this.mongoClient = this.createMongoClient()

    try {
      await this.mongoClient.connect()

      const res = await this.mongoClient.db().command({ ping: 1 })

      if (res.ok === 1) {
        this.log.info('Connected to Mongo DB')
        result = true

        const collections = await this.mongoClient.db().listCollections().toArray()
        if (!collections.find(col => col.name === Config.EVENT_STORE_DB.EVENTS_COLLECTION)) {
          await createReportingSchema(this.mongoClient, Config.EVENT_STORE_DB.EVENTS_COLLECTION)
          this.log.info('Set up Mongo DB Datasets & Schema')
        } else if (Config.EVENT_STORE_DB.APPLY_SCHEMA) {
          await applySchema(this.mongoClient, Config.EVENT_STORE_DB.EVENTS_COLLECTION)
          this.log.info('Applying Mongo DB Reporting Schema')
        }
      }
    } catch (err) {
      this.log.error('Failed to initialize MongoDB Service: ', err)
    }

    if (!result) {
      this.log.error('Could not initialize MongoDB Service')
    }

    return (this.initialized = result)
  }

  async saveToDB (records) {
    let result = false

    try {
      if (!this.mongoClient) {
        throw new Error('MongoDB client is not initialized, call initialize() first!')
      }

      const collection = await this.mongoClient.db().collection(Config.EVENT_STORE_DB.EVENTS_COLLECTION)
      await collection.insertMany(records)
      this.log.info(`Inserted records into MongoDB  [count: ${records.length}]`)
      result = true
    } catch (error) {
      this.log.warn('error in saveToDB: ', error)
      const newErr = new Error(`Error while attempting to save to MongoDB: ${error.message}\nRecord:\n${JSON.stringify(records, (key, value) => value === undefined ? '__undefined__' : value)}\n`)
      newErr.origin = error
      throw newErr
    }

    return result
  }

  async close () {
    await this.mongoClient?.close()
    this.mongoClient?.removeAllListeners()
    this.mongoClient = null
    this.log.info('Mongo DB is disconnected')
  }

  async healthCheck () {
    try {
      if (!this.mongoClient) {
        this.log.warn('No mongoClient for health check')
        return false
      }
      const res = await this.mongoClient.db().command({ ping: 1 })
      const isOk = res.ok === 1
      this.log.verbose('MongoDB health check status:', { isOk, res })
      return isOk
    } catch (err) {
      this.log.error('MongoDB health check failed:', err)
      return false
    }
  }

  createMongoClient () {
    const client = new MongoClient(this.mongoDBConnectionString, this.mongoDBServiceOptions)

    client.on('error', (err) => {
      this.log.error('mongoClient on error: ', err)
    });

    ['timeout', 'topologyClosed', 'close'].forEach(event => {
      client.on(event, (...args) => {
        this.log.warn(`mongoClient on ${event}: `, { args })
      })
    })

    return client
  }
}

module.exports = { MongoDBService }
