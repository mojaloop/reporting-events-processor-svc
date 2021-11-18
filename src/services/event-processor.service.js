const { quotesConstants } = require('../constants/quote-constants')
const { transferConstants } = require('../constants/transfer-constants')
const { settlementConstants } = require('../constants/settlement-constants')
const { eventType } = require('../constants/event-types')
const { getSettlementReportParams } = require('../custom-transformations/settlement-report-params')

class EventProcessorService {
  constructor (mongoDB, kafka) {
    this.mongoDBService = mongoDB
    this.kafkaService = kafka
  }

  initialize () {
    this.kafkaService.startConsumer((args) => { this.messageHandler(args) })
    return true
  }

  async messageHandler (args) {
    const listeningTopic = process.env.KAFKA_TOPIC_TO_CONSUME || 'topic-event'

    if (args.topic === listeningTopic) {
      let msg

      try {
        msg = JSON.parse(args.message.value.toString())
      } catch (error) {
        console.error('Failed to parse event message.', error, msg)
        return
      }

      if (!this.isAudit(msg)) {
        return
      }

      const eventType = this.determineEventType(msg)

      if (eventType === eventType.UNSUPPORTED) {
        return
      }

      const record = this.transformEvent(msg, eventType)

      console.dir(record)

      try {
        await this.mongoDBService.saveToDB(record)
      } catch (error) {
        console.error(
          'Failed to persist kafka event to mongo db',
          error
        )
      }
    }
  }

  isAudit (msg) {
    return msg?.metadata?.event?.type === eventType.AUDIT || false
  }

  determineEventType (msg) {
    if (msg.metadata?.trace?.service) {
      for (const service of quotesConstants) {
        if (msg.metadata.trace.service === service) { return eventType.QUOTE }
      }
      for (const service of transferConstants) {
        if (msg.metadata.trace.service === service) { return eventType.TRANSFER }
      }
      for (const service of settlementConstants) {
        if (msg.metadata.trace.service === service) { return eventType.SETTLEMENT }
      }
    }
    return eventType.UNSUPPORTED
  }

  transformEvent (msg, eventType) {
    const reportingParams = getReportingParams(msg, eventType)
    return {
      event: msg,
      metadata: {
        reporting: {
          eventType: eventType,
          ...reportingParams
        }
      }
    }
  }

  getReportingParams (msg, eventType) {
    switch(eventType) {
      case eventType.QUOTE:
      case eventType.TRANSFER:
        {
          return { transactionId: msg.metadata.trace.tags.transactionId }
        }
      case eventType.SETTLEMENT:
        {
          return getSettlementReportParams(msg)
        }
      default:
        return null
    }
  }
}

module.exports = { EventProcessorService }
