const { Kafka } = require('kafkajs')
const Config = require('../lib/config')

class KafkaService {
  constructor () {
    this.initialized = false
    this.kafkaClient = undefined
  }

  initialize () {
    let result = false
    let error
    const clientID = Config.KAFKA.CLIENT_ID
    try {
      this.kafkaClient = new Kafka({
        brokers: Config.KAFKA.BROKER_LIST,
        clientID
      })
      result = true
    } catch (err) {
      error = err
    }

    if (!result) {
      const message = 'Failed to connect to Kafka Client'
      console.error(message, error)
    }

    this.initialized = result

    return result
  }

  async startConsumer (messageHandleFunction) {
    const consumerGroup = Config.KAFKA.CONSUMER_GROUP
    const listeningTopic = Config.KAFKA.TOPIC_EVENT

    const consumer = this.kafkaClient.consumer({ groupId: consumerGroup })

    await consumer.connect()

    // Retry if the incase of the error UNKNOWN_TOPIC_OR_PARTITION
    function wait(n) { return new Promise(resolve => setTimeout(resolve, n)) }
    function consumeTopicWithRetry(topic) {   
      return consumer.subscribe({
        topic: topic,
        fromBeginning: false
      }).catch((e) => {
        if(e.type === 'UNKNOWN_TOPIC_OR_PARTITION') {
          console.warn('UNKNOWN_TOPIC_OR_PARTITION: Retrying...')
          return wait(1000).then(() => consumeTopicWithRetry(topic))
        } else {
          return Promise.reject(e)
        }
      })
    }

    await consumeTopicWithRetry(listeningTopic)

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) =>
        messageHandleFunction({ topic, partition, message })
    })
  }
}

module.exports = { KafkaService }
