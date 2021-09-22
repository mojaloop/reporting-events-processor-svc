const { Kafka } = require('kafkajs')

class KafkaService {
  constructor () {
    this.initialized = false
    this.kafkaClient = undefined
  }

  initialize () {
    let result = false
    let error
    const brokerURI = process.env.KAFKA_URI || 'localhost:9092'
    const clientID = process.env.KAFKA_CLIENT_ID || 'example-producer'
    try {
      this.kafkaClient = new Kafka({
        brokers: [`${brokerURI}`],
        clientID
      })
      result = true
    } catch (err) {
      error = err
    }

    if (!result) {
      let message = 'Failed to connect to Kafka Client'
      console.error(message, error)
    }

    this.initialized = result

    return result
  }

  async startConsumer (messageHandleFunction) {
    const consumerGroup = process.env.KAFKA_CONSUMER_GROUP || 'test-group'
    const listeningTopic = process.env.KAFKA_TOPIC_TO_CONSUME || 'topic-event'

    const consumer = this.kafkaClient.consumer({ groupId: consumerGroup })

    await consumer.connect()

    await consumer.subscribe({
      topic: listeningTopic,
      fromBeginning: false
    })

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) =>
        messageHandleFunction({ topic, partition, message })
    })
  }
}

module.exports = { KafkaService }
