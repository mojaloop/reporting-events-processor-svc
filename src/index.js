const { initConfig } = require('./config/config.js')
const { KafkaService } = require('./services/kafka.service.js')
const { MongoDBService } = require('./services/mongo-db.service.js')
const { EventProcessorService } = require('./services/event-processor.service.js')

async function main () {
  console.log('Service Starting')

  try {
    console.log('Loading Service Config')
    initConfig()
  } catch (error) {
    console.error('Service failed to load config:\n', error)
    console.info(
      'Service might not behave as expected due to config not loading correctly, using defaulted values'
    )
  }

  // Initialize Services
  console.log('Initializing Services')
  const mongoDBService = new MongoDBService(process.env.MONGO_DB_URI)
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
