const { quotesConstants } = require('../constants/quote-constants')
const { transferConstants } = require('../constants/transfer-constants')
const { settlementConstants } = require('../constants/settlement-constants')
const { fxQuotesConstants } = require('../constants/fxQuotes-constants')
const { fxTransferConstants } = require('../constants/fxTransfer-constants')
const { eventTypes } = require('../constants/event-types')
const { getSettlementReportParams } = require('../custom-transformations/settlement-report-params')
const Config = require('../lib/config')
const { getFxTransferParams } = require('../custom-transformations/fx-transfer-params')
const { getFxQuoteParams } = require('../custom-transformations/fx-quote-params')

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
  case eventTypes.FXTRANSFER:
  {
    return getFxTransferParams(msg)
  }
  case eventTypes.FXQUOTE:
  {
    return getFxQuoteParams(msg)
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

  async messageHandler (error, events) {
    if (error) throw error
    const listeningTopic = Config.KAFKA.TOPIC_EVENT

    const records = [].concat(events).map(message => {
      if (message.topic !== listeningTopic) return
      let event

      try {
        event = Buffer.isBuffer(message.value) ? JSON.parse(message.value.toString()) : message.value
      } catch (error) {
        console.error('Failed to parse event message.', error, event)
        return
      }

      if (!this.isAudit(event)) {
        return
      }

      const eventType = this.determineEventType(event)

      if (eventType === eventTypes.UNSUPPORTED) {
        return
      }

      return this.transformEvent(event, eventType)
    }).filter(Boolean)

    for (const record of records) {
      try {
        await this.mongoDBService.saveToDB(record)
      } catch (error) {
        console.error(
          'Failed to persist kafka event to mongo db for record:',
          record,
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
      for (const service of fxTransferConstants){
        if (msg.metadata.trace.service === service) { return eventTypes.FXTRANSFER }
      }
      for (const service of fxQuotesConstants){
        if (msg.metadata.trace.service === service) { return eventTypes.FXQUOTE }
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
