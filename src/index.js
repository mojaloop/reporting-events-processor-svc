const Config = require('./lib/config')
const { KafkaService } = require('./services/kafka.service.js')
const { MongoDBService } = require('./services/mongo-db.service.js')
const { EventProcessorService } = require('./services/event-processor.service.js')
const { ConnectionString } = require('connection-string')

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
    params: Config.EVENT_STORE_DB.DOCUMENT_DB_MODE
      ? { 'retryWrites': 'false' }
      : {}
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
}

main().catch(console.dir)
