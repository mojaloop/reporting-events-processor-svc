const Convict = require('convict')
const path = require('path')

// Declare configuration schema, default values and bindings to environment variables
const ConvictConfig = Convict({
  env: {
    doc: 'The application environment.',
    format: ['default', 'production', 'development', 'test', 'integration', 'e2e'],
    default: 'default',
    env: 'NODE_ENV',
  },
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
  },
  KAFKA: {
    BROKER_LIST: {
      doc: 'BROKER_LIST',
      format: Array,
      default: ['localhost:9092'],
      env: 'KAFKA_BROKER_LIST',
    },
    CONSUMER_GROUP: {
      doc: 'CONSUMER_GROUP',
      format: String,
      default: 'reporting_events_processor_consumer_group',
      env: 'KAFKA_CONSUMER_GROUP',
    },
    CLIENT_ID: {
      doc: 'CLIENT_ID',
      format: String,
      default: 'reporting_events_processor_consumer',
      env: 'KAFKA_CLIENT_ID',
    },
    TOPIC_EVENT: {
      doc: 'TOPIC_EVENT',
      format: String,
      default: 'topic-event',
      env: 'KAFKA_TOPIC_EVENT',
    },
  },
})

// Load environment dependent configuration
const env = ConvictConfig.get('env')
const configFile = process.env.CONFIG_FILE || path.join(process.cwd(), `./config/${env}.json`)
ConvictConfig.loadFile(configFile)

// Perform configuration validation
ConvictConfig.validate({ allowed: 'strict' })

// extract simplified config from Convict object
const config = {
  env: ConvictConfig.get('env'),
  EVENT_STORE_DB: ConvictConfig.get('EVENT_STORE_DB'),
  KAFKA: ConvictConfig.get('KAFKA'),
}

module.exports = config
