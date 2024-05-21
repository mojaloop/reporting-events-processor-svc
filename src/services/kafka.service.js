const { createHandler } = require('@mojaloop/central-services-stream').Util.Consumer
const Config = require('../lib/config')

class KafkaService {
  constructor () {
    this.initialized = false
    this.kafkaClient = undefined
  }

  initialize () {
    this.initialized = true
    return true
  }

  async startConsumer (messageHandleFunction) {
    await createHandler(Config.KAFKA.TOPIC_EVENT, Config.KAFKA.CONSUMER.EVENT.config, messageHandleFunction)
  }
}

module.exports = { KafkaService }
