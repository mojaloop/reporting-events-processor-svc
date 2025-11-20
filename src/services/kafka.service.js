const { Consumer } = require('@mojaloop/central-services-stream').Util
const Config = require('../lib/config')
const { logger } = require('../shared/logger')

class KafkaService {
  constructor () {
    this.initialized = false
  }

  initialize () {
    this.initialized = true
    return true
  }

  async startConsumer (messageHandleFunction) {
    const topic = Config.KAFKA.TOPIC_EVENT
    const config = Config.KAFKA.CONSUMER.EVENT.config
    await Consumer.createHandler(topic, config, messageHandleFunction)
    logger.info('kafka consumer started: ', { topic, config })
  }
}

module.exports = { KafkaService }
