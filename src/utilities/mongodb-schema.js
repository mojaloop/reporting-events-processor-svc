const { schema } = require('../constants/json-schema')

const createReportingSchema = async (client, dbName, colName) => {
  await client.db(dbName).createCollection(colName, {
    validator: {
      $jsonSchema: schema
    }
  })
}

const applySchema = async (client, dbName, colName) => {
  await client.db(dbName).command({
    collMod: colName,
    validator: {
      $jsonSchema: schema
    }
  })
}

module.exports = { createReportingSchema, applySchema }
