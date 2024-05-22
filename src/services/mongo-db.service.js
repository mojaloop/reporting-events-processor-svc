const { MongoClient } = require('mongodb')
const Config = require('../lib/config')
const { createReportingSchema, applySchema } = require('../utilities/mongodb-schema')

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
        console.log('Connected to Mongo DB')
        result = true

        const collections = await mongo.db().listCollections().toArray()
        if (!collections.find(col => col.name === Config.EVENT_STORE_DB.EVENTS_COLLECTION)) {
          await createReportingSchema(mongo, Config.EVENT_STORE_DB.EVENTS_COLLECTION)
          console.log('Set up Mongo DB Datasets & Schema')
        } else if (Config.EVENT_STORE_DB.APPLY_SCHEMA) {
          await applySchema(mongo, Config.EVENT_STORE_DB.EVENTS_COLLECTION)
          console.log('Applying Mongo DB Reporting Schema')
        }
      }
    } catch (err) {
      const message = 'Failed to initialize MongoDB Service: '
      console.error(message, err)
    } finally {
      await mongo.close()
    }

    if (!result) {
      const message = 'Could not initialize MongoDB Service'
      console.error(message)
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

      collection.insertMany(records)
      result = true
    } catch (error) {
      const newErr = new Error(`Error while attempting to save to Mongodb: ${error.message}\nRecord:\n${JSON.stringify(records)}\n`)

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
}

module.exports = { MongoDBService }
