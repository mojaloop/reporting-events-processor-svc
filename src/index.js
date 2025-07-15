const Config = require('./lib/config')
const { KafkaService } = require('./services/kafka.service.js')
const { MongoDBService } = require('./services/mongo-db.service.js')
const { EventProcessorService } = require('./services/event-processor.service.js')
const { ConnectionString } = require('connection-string')
const healthPlugin = require('./plugins/health').plugin
const { logger } = require('./shared/logger')
const Hapi = require('@hapi/hapi')

let server

const create = async ({ port }) => {
  server = new Hapi.Server({ port })
  await server.register([healthPlugin])
}

const start = async ({ enabled, port }) => {
  if (!enabled) return
  if (!server) await create({ port })
  await server.start()
  logger.info(`Monitoring server running at: ${server.info.uri}`)
}

const stop = async () => {
  await Promise.all([
    server.stop(),
  ])
  server = null
}

async function main () {
  console.log('Service Starting')

  // Initialize Services
  console.log('Initializing Services')

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
    port: Config.MONITORING.PORT
  })
}

main().catch(console.dir)

