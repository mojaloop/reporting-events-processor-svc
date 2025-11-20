const Hapi = require('@hapi/hapi')
const { ConnectionString } = require('connection-string')

const { name, version } = require('../package.json')
const { EventProcessorService } = require('./services/event-processor.service.js')
const { KafkaService } = require('./services/kafka.service.js')
const { MongoDBService } = require('./services/mongo-db.service.js')
const { logger } = require('./shared/logger')
const Config = require('./lib/config')
const healthPlugin = require('./plugins/health').plugin

let server

const create = async ({ port, mongoDBService }) => {
  server = new Hapi.Server({ port })
  await server.register([
    {
      plugin: healthPlugin,
      options: { mongoDBService }
    }
  ])
}

const start = async ({ enabled, port, mongoDBService }) => {
  if (!enabled) return
  if (!server) await create({ port, mongoDBService })
  await server.start()
  logger.info(`Monitoring server running at: ${server.info.uri}`)
}

async function main () {
  logger.info('Service starting...')

  // Initialize Services
  logger.verbose('Initializing Services')
  // Construct mongodb connection URL with SSL/TLS support
  const csMongoDBObj = new ConnectionString()
  csMongoDBObj.setDefaults({
    protocol: 'mongodb',
    hosts: [{ name: Config.EVENT_STORE_DB.HOST, port: Config.EVENT_STORE_DB.PORT }],
    user: Config.EVENT_STORE_DB.USER,
    password: Config.EVENT_STORE_DB.PASSWORD,
    path: [Config.EVENT_STORE_DB.DATABASE],
    params: Config.EVENT_STORE_DB.PARAMS
  })

  // Add SSL/TLS params if enabled
  const mongoServiceOptions = {}
  if (Config.EVENT_STORE_DB.SSL_ENABLED) {
    mongoServiceOptions.tls = true
    if (typeof Config.EVENT_STORE_DB.SSL_VERIFY !== 'undefined') {
      mongoServiceOptions.tlsAllowInvalidCertificates = !Config.EVENT_STORE_DB.SSL_VERIFY
    }
    if (Config.EVENT_STORE_DB.SSL_CA_FILE_PATH) {
      // Pass CA string directly to MongoDB driver options
      mongoServiceOptions.tlsCAFile = Config.EVENT_STORE_DB.SSL_CA_FILE_PATH
    }
    // Log options excluding CA
    const { tlsCAFile, ...mongoOptions } = mongoServiceOptions
    logger.info('MongoDB TLS options: ', { mongoOptions })
  }

  const mongoUri = csMongoDBObj.toString()
  const mongoDBService = new MongoDBService(mongoUri, mongoServiceOptions)
  const safeUri = mongoUri.replace(/(\/\/)(.*):(.*)@/, '$1****:****@')
  logger.info(`Connecting to MongoDB with URI: ${safeUri}`)
  const mongoDBOnline = await mongoDBService.initialize()

  if (!mongoDBOnline) {
    return
  }

  const kafkaService = new KafkaService()
  const kafkaOnline = kafkaService.initialize()

  if (!kafkaOnline) {
    return
  }

  const eventProcessorService = new EventProcessorService(
    mongoDBService,
    kafkaService
  )
  await eventProcessorService.initialize()

  await start({
    enabled: Config.MONITORING.ENABLED,
    port: Config.MONITORING.PORT,
    mongoDBService
  })

  logger.info(`${name}@${version} is started`)
}

main().catch(err => {
  logger.error('error starting service: ', err)
})
