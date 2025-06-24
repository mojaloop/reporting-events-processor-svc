const Convict = require('convict')
const path = require('path')

// Declare configuration schema, default values and bindings to environment variables
const ConvictConfig = Convict({
  EVENT_STORE_DB: {
    HOST: {
      doc: 'The Hostname/IP address of database',
      format: '*',
      default: 'localhost',
      env: 'EVENT_STORE_DB_HOST',
    },
    PORT: {
      doc: 'The port number of database',
      format: 'port',
      default: 27017,
      env: 'EVENT_STORE_DB_PORT',
    },
    USER: {
      doc: 'The user of database',
      format: '*',
      default: 'test',
      env: 'EVENT_STORE_DB_USER',
    },
    PASSWORD: {
      doc: 'The password of database',
      format: '*',
      default: 'test123',
      env: 'EVENT_STORE_DB_PASSWORD',
    },
    DATABASE: {
      doc: 'The database name in database',
      format: '*',
      default: 'admin',
      env: 'EVENT_STORE_DB_DATABASE',
    },
    EVENTS_COLLECTION: {
      doc: 'The collection name to store events',
      format: '*',
      default: 'reporting',
      env: 'EVENT_STORE_DB_EVENTS_COLLECTION',
    },
    APPLY_SCHEMA: {
      doc: 'Apply schema to existing collection',
      format: Boolean,
      default: false,
      env: 'EVENT_STORE_APPLY_SCHEMA',
    },
    PARAMS: {
      doc: 'Additional parameters for MongoDB connection',
      format: Object,
      default: {},
      env: 'EVENT_STORE_DB_PARAMS',
    }
  },
  KAFKA: {
    TOPIC_EVENT: {
      doc: 'TOPIC_EVENT',
      format: String,
      default: 'topic-event',
      env: 'KAFKA_TOPIC_EVENT',
    },
    CONSUMER: {
      EVENT: {
        config: {
          options: {},
          rdkafkaConf: {},
          topicConf: {},
        },
      },
    },
  },
})

const configFile = process.env.CONFIG_FILE || path.join(process.cwd(), './config/default.json')
ConvictConfig.loadFile(configFile)

// Perform configuration validation
ConvictConfig.validate({ allowed: 'strict' })

// extract simplified config from Convict object
const config = {
  EVENT_STORE_DB: ConvictConfig.get('EVENT_STORE_DB'),
  KAFKA: ConvictConfig.get('KAFKA'),
}

module.exports = config
