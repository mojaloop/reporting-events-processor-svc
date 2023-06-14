const { MongoClient } = require('mongodb')
const Config = require('../lib/config')
const { createReportingSchema, applySchema } = require('../utilities/mongodb-schema')

class MongoDBService {
  constructor (mongoDbURI) {
    this.initialized = false
    this.mongoDBConnectionString = mongoDbURI || 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000'
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
        } else {
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

  async saveToDB (record) {
    const saveClient = new MongoClient(this.mongoDBConnectionString)
    let result = false
    try {
      await saveClient.connect()

      const collection = await saveClient.db().collection(Config.EVENT_STORE_DB.EVENTS_COLLECTION)

      await collection.insertOne(record)
      result = true
    } catch (error) {
      const newErr = new Error(`Error while attempting to save to Mongodb: ${error.message}\nRecord:\n${JSON.stringify(record)}\n`)

      newErr.origin = error

      throw newErr
    } finally {
      await saveClient.close()
    }
    return result
  }
}

module.exports = { MongoDBService }
