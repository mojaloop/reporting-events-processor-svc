const Convict = require('convict')
const path = require('path')

// Declare configuration schema, default values and bindings to environment variables
const ConvictConfig = Convict({
  EVENT_STORE_DB: {
    HOST: {
      doc: 'The Hostname/IP address of database',
      format: String,
      default: 'localhost',
      env: 'EVENT_STORE_DB_HOST'
    },
    PORT: {
      doc: 'The port number of database',
      format: 'port',
      default: 27017,
      env: 'EVENT_STORE_DB_PORT'
    },
    USER: {
      doc: 'The user of database',
      format: String,
      default: 'test',
      env: 'EVENT_STORE_DB_USER'
    },
    PASSWORD: {
      doc: 'The password of database',
      format: String,
      default: 'test123',
      env: 'EVENT_STORE_DB_PASSWORD'
    },
    DATABASE: {
      doc: 'The database name in database',
      format: String,
      default: 'admin',
      env: 'EVENT_STORE_DB_DATABASE'
    },
    EVENTS_COLLECTION: {
      doc: 'The collection name to store events',
      format: String,
      default: 'reporting',
      env: 'EVENT_STORE_DB_EVENTS_COLLECTION'
    },
    APPLY_SCHEMA: {
      doc: 'Apply schema to existing collection',
      format: Boolean,
      default: false,
      env: 'EVENT_STORE_APPLY_SCHEMA'
    },
    PARAMS: {
      doc: 'Additional parameters for MongoDB connection',
      format: function (val) {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val)
          } catch (e) {
            throw new Error('EVENT_STORE_DB_PARAMS must be valid JSON')
          }
        } else if (typeof val !== 'object') {
          throw new Error('EVENT_STORE_DB_PARAMS must be an object or a JSON string')
        }
        return val
      },
      default: {},
      env: 'EVENT_STORE_DB_PARAMS'
    }
  },

  MONITORING: {
    ENABLED: {
      doc: 'Enable monitoring server',
      format: Boolean,
      default: true,
      env: 'MONITORING_ENABLED'
    },
    PORT: {
      doc: 'Port for monitoring server',
      format: 'port',
      default: 3000,
      env: 'MONITORING_PORT'
    }
  },

  KAFKA: {
    TOPIC_EVENT: {
      doc: 'TOPIC_EVENT',
      format: String,
      default: 'topic-event',
      env: 'KAFKA_TOPIC_EVENT'
    },
    CONSUMER: {
      EVENT: {
        config: {
          options: {},
          rdkafkaConf: {},
          topicConf: {}
        }
      }
    }
  }
})

const configFile = process.env.CONFIG_FILE || path.join(process.cwd(), './config/default.json')
ConvictConfig.loadFile(configFile)

// Perform configuration validation
ConvictConfig.validate({ allowed: 'strict' })

if (ConvictConfig.get('EVENT_STORE_DB').SSL_ENABLED || process.env.EVENT_STORE_DB_SSL_ENABLED === 'true') {
  ConvictConfig.set('EVENT_STORE_DB.SSL_ENABLED', true)
  ConvictConfig.set('EVENT_STORE_DB.SSL_VERIFY', process.env.EVENT_STORE_DB_SSL_VERIFY !== 'false')
  if (process.env.EVENT_STORE_DB_SSL_CA_FILE_PATH) {
    ConvictConfig.set('EVENT_STORE_DB.SSL_CA_FILE_PATH', process.env.EVENT_STORE_DB_SSL_CA_FILE_PATH)
  }
}

// extract simplified config from Convict object
const config = {
  EVENT_STORE_DB: ConvictConfig.get('EVENT_STORE_DB'),
  KAFKA: ConvictConfig.get('KAFKA'),
  MONITORING: ConvictConfig.get('MONITORING')
}

module.exports = config
