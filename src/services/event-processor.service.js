const { Binary } = require('mongodb')

const Config = require('../lib/config')
const { quotesConstants } = require('../constants/quote-constants')
const { transferConstants } = require('../constants/transfer-constants')
const { settlementConstants } = require('../constants/settlement-constants')
const { fxQuotesConstants } = require('../constants/fxQuotes-constants')
const { fxTransferConstants } = require('../constants/fxTransfer-constants')
const { eventTypes } = require('../constants/event-types')
const { getSettlementReportParams } = require('../custom-transformations/settlement-report-params')
const { getFxTransferParams } = require('../custom-transformations/fx-transfer-params')
const { getFxQuoteParams } = require('../custom-transformations/fx-quote-params')
const { logger } = require('../shared/logger')

const _getReportingParams = (msg, eventType) => {
  switch (eventType) {
  case eventTypes.QUOTE:
  case eventTypes.TRANSFER: {
    const transactionId = msg?.metadata?.trace?.tags?.transactionId
    return transactionId ? { transactionId } : {}
  }
  case eventTypes.SETTLEMENT:
    return getSettlementReportParams(msg)
  case eventTypes.FXTRANSFER:
    return getFxTransferParams(msg)
  case eventTypes.FXQUOTE:
    return getFxQuoteParams(msg)
  default:
    return null
  }
}

class EventProcessorService {
  constructor (mongoDB, kafka) {
    this.mongoDBService = mongoDB
    this.kafkaService = kafka
    this.log = logger.child({ component: this.constructor.name })
  }

  async initialize () {
    await this.kafkaService.startConsumer((...args) => this.messageHandler(...args))
    return true
  }

  async messageHandler (error, messages) {
    if (error) {
      this.log.error('got error from kafka instead of messages, skip processing: ', error)
      throw error
    }

    try {
      const events = [].concat(messages)
        .map(msg => this.parseOneEvent(msg))
        .filter(Boolean)

      if (events.length) await this.mongoDBService.saveToDB(events)
    } catch (error) {
      this.log.error('Failed to process kafka events', error)
    }
  }

  isAudit (msg) {
    return msg?.metadata?.event?.type === eventTypes.AUDIT
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
      for (const service of fxTransferConstants) {
        if (msg.metadata.trace.service === service) { return eventTypes.FXTRANSFER }
      }
      for (const service of fxQuotesConstants) {
        if (msg.metadata.trace.service === service) { return eventTypes.FXQUOTE }
      }
    }
    return eventTypes.UNSUPPORTED
  }

  transformEvent (msg, eventType) {
    const reportingParams = _getReportingParams(msg, eventType)
    return {
      _id: EventProcessorService.uuidToBson(msg.id),
      event: msg,
      metadata: {
        reporting: {
          eventType,
          ...reportingParams
        }
      }
    }
  }

  parseOneEvent (message) {
    if (message.topic !== Config.KAFKA.TOPIC_EVENT) {
      this.log.verbose('skip message processing from incorrect topic')
      return
    }

    let event

    try {
      event = Buffer.isBuffer(message.value) ? JSON.parse(message.value.toString()) : message.value
    } catch (error) {
      this.log.warn('Failed to parse event message', error)
      return
    }

    if (!this.isAudit(event)) {
      this.log.verbose('skip non-audit event')
      return
    }

    const eventType = this.determineEventType(event)

    if (eventType === eventTypes.UNSUPPORTED) {
      this.log.verbose('skip unsupported eventType')
      return
    }

    return this.transformEvent(event, eventType)
  }

  static uuidToBson(uuid) {
    return new Binary(Buffer.from(uuid.replace(/-/g, ''), 'hex'), Binary.SUBTYPE_UUID)
  }
}

module.exports = { EventProcessorService }
