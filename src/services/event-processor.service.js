const { quotesConstants } = require('../constants/quote-constants')
const { transferConstants } = require('../constants/transfer-constants')
const { settlementConstants } = require('../constants/settlement-constants')
const { eventTypes } = require('../constants/event-types')
const { getSettlementReportParams } = require('../custom-transformations/settlement-report-params')
const Config = require('../lib/config')

const _getReportingParams = (msg, eventType) => {
  switch(eventType) {
  case eventTypes.QUOTE:
  case eventTypes.TRANSFER:
  {
    return { transactionId: msg.metadata.trace.tags.transactionId }
  }
  case eventTypes.SETTLEMENT:
  {
    return getSettlementReportParams(msg)
  }
  default:
    return null
  }
}

class EventProcessorService {
  constructor (mongoDB, kafka) {
    this.mongoDBService = mongoDB
    this.kafkaService = kafka
  }

  initialize () {
    this.kafkaService.startConsumer((...args) => { this.messageHandler(...args) })
    return true
  }

  async messageHandler (error, args) {
    if (error) throw error
    const listeningTopic = Config.KAFKA.TOPIC_EVENT

    if (args.topic === listeningTopic) {
      let msg

      try {
        msg = JSON.parse(args.value.toString())
      } catch (error) {
        console.error('Failed to parse event message.', error, msg)
        return
      }

      if (!this.isAudit(msg)) {
        return
      }

      console.log(`Processing eventId: ${msg.id}`)

      const eventType = this.determineEventType(msg)

      if (eventType === eventTypes.UNSUPPORTED) {
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
    return msg?.metadata?.event?.type === eventTypes.AUDIT || false
  }

  determineEventType (msg) {
    if (msg.metadata?.trace?.service) {
      for (const service of quotesConstants) {
        if (msg.metadata.trace.service === service) { return eventTypes.QUOTE }
      }
      for (const service of transferConstants) {
        if (msg.metadata.trace.service === service) { return eventTypes.TRANSFER }
      }
      for (const service of settlementConstants) {
        if (msg.metadata.trace.service === service) { return eventTypes.SETTLEMENT }
      }
    }
    return eventTypes.UNSUPPORTED
  }

  transformEvent (msg, eventType) {
    const reportingParams = _getReportingParams(msg, eventType)
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
}

module.exports = { EventProcessorService }
