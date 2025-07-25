const Config = require('./lib/config')
const { KafkaService } = require('./services/kafka.service.js')
const { MongoDBService } = require('./services/mongo-db.service.js')
const { EventProcessorService } = require('./services/event-processor.service.js')
const { ConnectionString } = require('connection-string')
const healthPlugin = require('./plugins/health').plugin
const { logger } = require('./shared/logger')
const Hapi = require('@hapi/hapi')
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
  logger.info('Service Starting')

  // Initialize Services
  logger.info('Initializing Services')

  // Construct mongodb connection URL
  const csMongoDBObj = new ConnectionString()
  csMongoDBObj.setDefaults({
    protocol: 'mongodb',
    hosts: [{ name: Config.EVENT_STORE_DB.HOST, port: Config.EVENT_STORE_DB.PORT }],
    user: Config.EVENT_STORE_DB.USER,
    password: Config.EVENT_STORE_DB.PASSWORD,
    path: [Config.EVENT_STORE_DB.DATABASE],
    params: Config.EVENT_STORE_DB.PARAMS
  })

  const mongoDBService = new MongoDBService(csMongoDBObj.toString())
  logger.debug(`Connecting to MongoDB with URI: ${mongoDBService.uri}`);
  const safeUri = mongoDBService.uri.replace(/(\/\/)(.*):(.*)@/, '$1****:****@');
  logger.info(`Connecting to MongoDB with URI: ${safeUri}`);
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

  eventProcessorService.initialize()
  await start({
    enabled: Config.MONITORING.ENABLED,
    port: Config.MONITORING.PORT,
    mongoDBService
  })
}

main().catch(console.dir)
