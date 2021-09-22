const { MongoClient } = require('mongodb')
const { createReportingSchema, applySchema } = require('../utilities/mongodb-schema')

class MongoDBService {
  constructor (mongoDbURI) {
    this.initialized = false
    this.mongoDBConnectionString = mongoDbURI || 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000'
  }

  async initialize () {
    let result = false
    let error
    const mongo = new MongoClient(this.mongoDBConnectionString)
    try {
      await mongo.connect()

      const res = await mongo.db('Kafka').command({ ping: 1 })

      if (res.ok === 1) {
        console.log('Connected to Mongo DB')
        result = true
      }

      const collections = await mongo.db('Kafka').listCollections().toArray()
      if (!collections.find(col => col.name === 'reportingData')) {
        await createReportingSchema(mongo, 'Kafka', 'reportingData')
        console.log('Set up Mongo DB Datasets & Schema')
      } else {
        await applySchema(mongo, 'Kafka', 'reportingData')
        console.log('Applying Mongo DB Reporting Schema')
      }
    } catch (err) {
      error = err
    } finally {
      await mongo.close()
    }

    if (!result) {
      let message = 'Failed to connect to MongoDB'

      if (!error) {
        message += ' due to an unexpected error that was thrown:'
        console.error(message, error)
      } else {
        console.error(message)
      }
    }

    this.initialized = result

    return result
  }

  async saveToDB (record) {
    const saveClient = new MongoClient(this.mongoDBConnectionString)
    try {
      await saveClient.connect()

      const collection = await saveClient.db('Kafka').collection('reportingData')

      await collection.insertOne(record)
    } catch (error) {
      const newErr = new Error(`Error while attempting to save to Mongodb: ${error.message}`)

      newErr.origin = error

      throw newErr
    } finally {
      await saveClient.close()
    }
  }
}

module.exports = { MongoDBService }
