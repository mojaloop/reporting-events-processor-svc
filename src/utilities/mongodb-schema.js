const { schema } = require('../constants/json-schema')

const createReportingSchema = async (client, colName) => {
  await client.db().createCollection(colName, {
    validator: {
      $jsonSchema: schema
    }
  })
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
