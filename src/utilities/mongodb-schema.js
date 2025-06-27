const { schema } = require('../constants/json-schema')

const createReportingSchema = async (client, colName) => {
  await client.db().createCollection(colName, {
    validator: {
      $jsonSchema: schema
    }
  })

  // Create indexes for fields that require them
  await client.db().collection(colName).createIndex({ 'metadata.reporting.transactionId': 1 })
  await client.db().collection(colName).createIndex({ 'metadata.reporting.transferId': 1 })
  await client.db().collection(colName).createIndex({ 'metadata.reporting.eventType': 1 })
}

const applySchema = async (client, colName) => {
  await client.db().command({
    collMod: colName,
    validator: {
      $jsonSchema: schema
    }
  })
}

module.exports = { createReportingSchema, applySchema }
