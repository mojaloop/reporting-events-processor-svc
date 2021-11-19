const { eventTypes } = require('../../../src/constants/event-types.js')
const { EventProcessorService } = require('../../../src/services/event-processor.service.js')
const { forwardQuoteRequestMsg, mlTransferFulfilMsg, createSettlementMsg } = require('../data/sample-events.json')

describe('Event Processor Service', () => {
  beforeAll(() => {
    mongoService = jest.fn().mockImplementation((args) => {
      return { saveToDB: jest.fn().mockImplementation((args) => { }) }
    })

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

  it('Determine eventType: Unsupported', () => {
    const msg = { Test: "Data" }

    const determined = determineEventType(msg)
    expect(determined).toEqual(eventTypes.UNSUPPORTED)
  })

  it('Message handler: Success', () => {

    const origin = JSON.stringify({ metadata: { event: { type: 'audit' } } })
    let newBuff = Buffer.from(origin);

    messageArgs = {
      topic: 'topic-event',
      message: { value: JSON.stringify(newBuff) }
    }

    eventProcessor.messageHandler(messageArgs);
    expect(eventProcessor).toBeDefined();
  })

  it('Message handler: Failure to parse message', () => {

    let newBuff = Buffer.from("BadBufferTest");

    messageArgs = {
      topic: 'topic-event',
      message: { value: JSON.stringify(newBuff) }
    }

    eventProcessor.messageHandler(messageArgs);
    expect(eventProcessor).toBeDefined();
  })

  it('Message handler: Not Audit', () => {

    const origin = JSON.stringify({ metadata: { event: { type: 'notAudit' } } })
    let newBuff = Buffer.from(origin);

    messageArgs = {
      topic: 'topic-event',
      message: { value: newBuff }
    }

    eventProcessor.messageHandler(messageArgs);
    expect(eventProcessor).toBeDefined();
  })

  it('initialize', () => {

    spyStartConsumer = jest
      .spyOn(kafkaService, 'startConsumer')
      .mockImplementation((props) => { eventProcessor.messageHandler(props) });

    const result = eventProcessor.initialize();

    expect(result).toEqual(true)
    spyStartConsumer.mockReset();
  })
})
