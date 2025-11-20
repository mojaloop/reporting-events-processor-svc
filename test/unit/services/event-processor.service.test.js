const { eventTypes } = require('../../../src/constants/event-types.js')
const { EventProcessorService } = require('../../../src/services/event-processor.service.js')
const { forwardQuoteRequestMsg, mlTransferFulfilMsg, createSettlementMsg } = require('../data/sample-events.json')
const { ml_fxTransfer_prepare, qs_fxQuote_forwardFxQuoteUpdate } = require('../data/sample-fx-events.json')

describe('Event Processor Service', () => {
  let mongoService
  let kafkaService
  let eventProcessor
  let transformEvent
  let isAudit
  let determineEventType

  beforeAll(() => {
    mongoService = { saveToDB: jest.fn().mockImplementation((args) => { }) }

    kafkaService = { startConsumer: jest.fn().mockImplementation((args) => { }) }

    eventProcessor = new EventProcessorService(mongoService, kafkaService)

    transformEvent = eventProcessor.transformEvent
    isAudit = eventProcessor.isAudit
    determineEventType = eventProcessor.determineEventType

  })

  it('Determine event is of type: audit', () => {
    const msg = forwardQuoteRequestMsg

    const result = isAudit(msg)
    expect(result).toBeTruthy()
  })

  it('Determine transformation of quotes message', () => {
    const msg = forwardQuoteRequestMsg

    const transformed = transformEvent(msg, eventTypes.QUOTE)
    expect(transformed).toHaveProperty('event')
    expect(transformed).toHaveProperty('metadata')
    expect(transformed.metadata).toHaveProperty('reporting')
    expect(transformed.metadata.reporting).toHaveProperty('eventType')
    expect(transformed.metadata.reporting).toHaveProperty('transactionId')
    expect(transformed.metadata.reporting.eventType).toEqual(eventTypes.QUOTE)
    expect(transformed.metadata.reporting.transactionId).toEqual(msg.metadata.trace.tags.transactionId)
  })

  it('Determine transformation of fxQuote message', () => {
    const msg = qs_fxQuote_forwardFxQuoteUpdate

    const transformed = transformEvent(msg, eventTypes.FXQUOTE)
    expect(transformed).toHaveProperty('event')
    expect(transformed).toHaveProperty('metadata')
    expect(transformed.metadata).toHaveProperty('reporting')
    expect(transformed.metadata.reporting).toHaveProperty('eventType')
    expect(transformed.metadata.reporting).toHaveProperty('transactionId')
    expect(transformed.metadata.reporting.eventType).toEqual(eventTypes.FXQUOTE)
    expect(transformed.metadata.reporting.transactionId).toEqual(msg.metadata.trace.tags.transactionId)
  })

  it('Determine transformation of fxTransfer message', () => {
    const msg = ml_fxTransfer_prepare

    const transformed = transformEvent(msg, eventTypes.FXTRANSFER)
    expect(transformed).toHaveProperty('event')
    expect(transformed).toHaveProperty('metadata')
    expect(transformed.metadata).toHaveProperty('reporting')
    expect(transformed.metadata.reporting).toHaveProperty('eventType')
    expect(transformed.metadata.reporting).toHaveProperty('transactionId')
    expect(transformed.metadata.reporting.eventType).toEqual(eventTypes.FXTRANSFER)
    // Using commitRequestId in this case as the ml_fxTransfer_prepare has no transactionId and it is mapped to commitRequestId for it
    expect(transformed.metadata.reporting.transactionId).toEqual(msg.content.payload.commitRequestId)
  })

  it('Determine transformation of settlement message', () => {
    const msg = createSettlementMsg

    const transformed = transformEvent(msg, eventTypes.SETTLEMENT)
    expect(transformed).toHaveProperty('event')
    expect(transformed).toHaveProperty('metadata')
    expect(transformed.metadata).toHaveProperty('reporting')
    expect(transformed.metadata.reporting).toHaveProperty('eventType')
    expect(transformed.metadata.reporting).toHaveProperty('settlementId')
    expect(transformed.metadata.reporting.eventType).toEqual(eventTypes.SETTLEMENT)
    expect(transformed.metadata.reporting.settlementId).toEqual(msg.metadata.trace.tags.transactionId)
  })

  it('Determine eventType: Quote', () => {
    const msg = forwardQuoteRequestMsg

    const determined = determineEventType(msg)
    expect(determined).toEqual(eventTypes.QUOTE)
  })

  it('Determine eventType: Transfer', () => {
    const msg = mlTransferFulfilMsg

    const determined = determineEventType(msg)
    expect(determined).toEqual(eventTypes.TRANSFER)
  })

  it('Determine eventType: Settlement', () => {
    const msg = createSettlementMsg

    const determined = determineEventType(msg)
    expect(determined).toEqual(eventTypes.SETTLEMENT)
  })

  it('Determine eventType: FXTRANSFER', () => {
    const msg = ml_fxTransfer_prepare

    const determined = determineEventType(msg)
    expect(determined).toEqual(eventTypes.FXTRANSFER)
  })

  it('Determine eventType: FXQUOTE', () => {
    const msg = qs_fxQuote_forwardFxQuoteUpdate

    const determined = determineEventType(msg)
    expect(determined).toEqual(eventTypes.FXQUOTE)
  })

  it('Determine eventType: Unsupported', () => {
    const msg = { Test: "Data" }

    const determined = determineEventType(msg)
    expect(determined).toEqual(eventTypes.UNSUPPORTED)
  })

  it('Message handler: Success ml_fxTransfer_fulfill', () => {

    const messageArgs = {
      topic: 'topic-event-audit',
      value: { metadata: { event: { type: 'audit' }, trace: { service: 'ml_fxTransfer_fulfill', tags: {transactionId: '1'}} } }
    }

    eventProcessor.messageHandler(undefined, messageArgs);
    expect(eventProcessor).toBeDefined();
  })

  it('Message handler: Success qs_fxQuote_forwardFxQuoteUpdate', () => {

    const messageArgs = {
      topic: 'topic-event-audit',
      value: { metadata: { event: { type: 'audit' }, trace: { service: 'qs_fxQuote_forwardFxQuoteUpdate', tags: {transactionId: '1'}} } }
    }

    eventProcessor.messageHandler(undefined, messageArgs);
    expect(eventProcessor).toBeDefined();
  })

  it('Message handler: Success ml_transfer_prepare', () => {

    const messageArgs = {
      topic: 'topic-event-audit',
      value: { metadata: { event: { type: 'audit' }, trace: { service: 'ml_transfer_prepare', tags: {transactionId: '1'}} } }
    }

    eventProcessor.messageHandler(undefined, messageArgs);
    expect(eventProcessor).toBeDefined();
  })

  it('Message handler: Success updateSettlementById', () => {

    const messageArgs = {
      topic: 'topic-event-audit',
      value: { metadata: { event: { type: 'audit' }, trace: { service: 'updateSettlementById'} } }
    }

    eventProcessor.messageHandler(undefined, messageArgs);
    expect(eventProcessor).toBeDefined();
  })

  it('Message handler: Success closeSettlementWindow', () => {

    const messageArgs = {
      topic: 'topic-event-audit',
      value: { metadata: { event: { type: 'audit' }, trace: { service: 'closeSettlementWindow'} } }
    }

    eventProcessor.messageHandler(undefined, messageArgs);
    expect(eventProcessor).toBeDefined();
  })

  it('Message handler: Failure to parse message', () => {

    let newBuff = Buffer.from("BadBufferTest");

    const messageArgs = {
      topic: 'topic-event-audit',
      value: newBuff
    }

    eventProcessor.messageHandler(undefined, messageArgs);
    expect(eventProcessor).toBeDefined();
  })

  it('Message handler: Not Audit', () => {

    const origin = JSON.stringify({ metadata: { event: { type: 'notAudit' } } })
    let newBuff = Buffer.from(origin);

    const messageArgs = {
      topic: 'topic-event-audit',
      value: newBuff
    }

    eventProcessor.messageHandler(undefined, messageArgs);
    expect(eventProcessor).toBeDefined();
  })

  it('Message handler: Error', () => {
    expect(() => eventProcessor.messageHandler(new Error('test error'))).rejects.toThrow();
  })

  it('initialize', async () => {

    const spyStartConsumer = jest
      .spyOn(kafkaService, 'startConsumer')
      .mockImplementation((props) => { eventProcessor.messageHandler(undefined, props) });

    const result = await eventProcessor.initialize();

    expect(result).toEqual(true)
    spyStartConsumer.mockReset();
  })
})
