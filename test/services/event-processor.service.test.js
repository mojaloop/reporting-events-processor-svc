const { eventType } = require('../../src/constants/event-types.js')
const { EventProcessorService } = require('../../src/services/event-processor.service.js')

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

    unprocessedQuote = {
      id: 'a31f3937-1ae0-4a2e-9d40-ad025a8fe5dd',
      content: { headers: { 'content-type': 'application/vnd.interoperability.quotes+json;version=1.0', accept: 'application/vnd.interoperability.quotes+json;version=1.0', date: 'Wed, 01 Sep 2021 14:34:15 GMT', 'fspiop-source': 'testingtoolkitdfsp', authorization: '{$inputs.TTK_BEARER_TOKEN}', 'fspiop-destination': 'payeefsp', traceparent: '00-aabb2a667dd4e2d3d96c241a0656a888-0123456789abcdef0-00', 'user-agent': 'axios/0.21.1', 'content-length': '600', host: 'test1-quoting-service', connection: 'keep-alive' }, payload: { transactionReferenceId: '9fb8e20c-7faa-465e-9927-bcc57637fe71', transactionInitiatorTypeId: 1, transactionInitiatorId: 1, transactionScenarioId: 1, amountTypeId: 2, quoteId: '31782ab9-de5a-4bd3-910a-f663d3ed91b9', payerId: 1, payeeId: 2 } },
      type: 'application/json',
      metadata: { event: { id: '2b1fce52-f481-4ab9-8d6a-9f7e281a8efe', type: 'audit', action: 'start', createdAt: '2021-09-01T14:34:16.163Z', state: { status: 'success' } }, trace: { service: 'qs_quote_forwardQuoteRequest', traceId: 'aabb2a667dd4e2d3d96c241a0656a888', spanId: '32b542b3bef07f34', parentSpanId: '8e800de677de94a8', sampled: 0, flags: 0, startTimestamp: '2021-09-01T14:34:16.162Z', tags: { tracestate: 'mojaloop=eyJzcGFuSWQiOiIzMmI1NDJiM2JlZjA3ZjM0In0=', transactionType: 'quote', transactionAction: 'prepare', transactionId: '9fb8e20c-7faa-465e-9927-bcc57637fe71', quoteId: '31782ab9-de5a-4bd3-910a-f663d3ed91b9', source: 'testingtoolkitdfsp', destination: 'payeefsp', payeeFsp: 'payeefsp', payerFsp: 'testingtoolkitdfsp' } }, 'protocol.createdAt': 1630506856165 }
    }

    unprocessedTransfer = {
      id: '595580f2-abe4-4fc4-a8e6-68c4ce85f86f',
      content: { headers: { 'content-type': 'application/vnd.interoperability.transfers+json;version=1.0', accept: 'application/vnd.interoperability.transfers+json;version=1.0', date: '2021-09-02T08:00:18.000Z', 'fspiop-source': 'noresponsepayeefsp', authorization: '{$inputs.NORESPONSE_BEARER_TOKEN}', 'fspiop-destination': 'testingtoolkitdfsp', traceparent: '00-aabbf28b8a2c9cec0316eadb932b9025-0123456789abcdef0-00', 'user-agent': 'axios/0.21.1', 'content-length': '87', host: 'test1-ml-api-adapter-service', connection: 'keep-alive' }, dataUri: 'data:application/vnd.interoperability.transfers+json;version=1.0;base64,eyJ0cmFuc2ZlclN0YXRlIjoiUkVTRVJWRUQiLCJmdWxmaWxtZW50IjoiVU5sSjk4aFpUWV9kc3cwY0FxdzRpX1VOM3Y0dXR0N0NaRkI0eWZMYlZGQSJ9', payload: { transferState: 'RESERVED', fulfilment: 'UNlJ98hZTY_dsw0cAqw4i_UN3v4utt7CZFB4yfLbVFA' }, params: { id: '004f5b3c-9692-4ab9-bd87-1960faf4876c' } },
      type: 'application/json',
      metadata: { event: { id: 'c75c91c5-d95f-4ac5-8544-316ab7cb7a15', type: 'audit', action: 'start', createdAt: '2021-09-02T08:00:18.497Z', state: { status: 'success' } }, trace: { service: 'ml_transfer_fulfil', traceId: 'aabbf28b8a2c9cec0316eadb932b9025', spanId: '1d3345e8d0f7ab4a', sampled: 0, flags: 0, startTimestamp: '2021-09-02T08:00:18.494Z', tags: { tracestate: 'mojaloop=eyJzcGFuSWQiOiIxZDMzNDVlOGQwZjdhYjRhIiwidGltZUFwaUZ1bGZpbCI6IjE2MzA1Njk2MTg0OTcifQ==', transactionType: 'transfer', transactionAction: 'fulfil', transactionId: '004f5b3c-9692-4ab9-bd87-1960faf4876c', source: 'noresponsepayeefsp', destination: 'testingtoolkitdfsp' } }, 'protocol.createdAt': 1630569618499 }
    }

    unprocessedSettlement = {
      id: '1a5daf40-5884-43dc-a676-e1f73e80dd03',
      content: { value: { from: 'payeefsp', to: 'testingtoolkitdfsp', id: '9fb8e20c-7faa-465e-9927-bcc57637fe71', content: { uriParams: { id: '9fb8e20c-7faa-465e-9927-bcc57637fe71' }, headers: { host: 'ml-api-adapter.bof1.test.mojaloop.live', 'x-request-id': '0a8b02dfb0184a661dbab8fd053e1108', 'x-real-ip': '10.1.2.87', 'x-forwarded-for': '10.1.2.87', 'x-forwarded-host': 'ml-api-adapter.bof1.test.mojaloop.live', 'x-forwarded-port': '80', 'x-forwarded-proto': 'http', 'x-scheme': 'http', 'content-length': '136', 'content-type': 'application/vnd.interoperability.transfers+json;version=1.0', date: '2021-09-01T14:34:16.000Z', 'fspiop-source': 'payeefsp', 'fspiop-destination': 'testingtoolkitdfsp', 'fspiop-http-method': 'PUT', 'fspiop-uri': '/transfers/9fb8e20c-7faa-465e-9927-bcc57637fe71', 'fspiop-signature': '{"signature":"iaz0SO9tCjJ5gUoDn8TQkm2oT6cZr_zrMqsSosF0J71W9_y8Tv99IUmFochTawxwmMyaVJ6fiR-yW51xLDthBC7hpqDm4kL2qlBHuK-xSiGFGhA1KmwsxxhHPg0YWGbmg5qHjP0RlxWqA4FdEm7nhRg1fz_EyPohOeraCB1Z6UJEI0M9q6cbSz80lm5Gjv6BSiobahYbheN6U3cXsWuk3gVCT3P78e3YxO_yWMxk8QrmCim8aS3ASLNvwb-GU68MQ_GWs26QXcDg4BYmydW6tIwqY816QZn4QNt0RQiORwqrslIbn7JGA8-aFWzCE4KmTDniFDWqtc7jVpZjO09UJQ","protectedHeader":"eyJhbGciOiJSUzI1NiIsIkZTUElPUC1VUkkiOiIvdHJhbnNmZXJzLzlmYjhlMjBjLTdmYWEtNDY1ZS05OTI3LWJjYzU3NjM3ZmU3MSIsIkZTUElPUC1IVFRQLU1ldGhvZCI6IlBVVCIsIkZTUElPUC1Tb3VyY2UiOiJwYXllZWZzcCIsIkZTUElPUC1EZXN0aW5hdGlvbiI6InRlc3Rpbmd0b29sa2l0ZGZzcCIsIkRhdGUiOiJXZWQsIDAxIFNlcCAyMDIxIDE0OjM0OjE2IEdNVCJ9"}' }, payload: 'data:application/vnd.interoperability.transfers+json;version=1.0;base64,eyJjb21wbGV0ZWRUaW1lc3RhbXAiOiIyMDIxLTA5LTAxVDE0OjM0OjE2Ljc1MVoiLCJ0cmFuc2ZlclN0YXRlIjoiQ09NTUlUVEVEIiwiZnVsZmlsbWVudCI6Imd6bGJzeHl0LUhERkNZUXZrT09xVUVvMVRQcDlmR0pGQWJGekFPZ1RFMHcifQ' }, type: 'application/json', metadata: { correlationId: '9fb8e20c-7faa-465e-9927-bcc57637fe71', event: { type: 'notification', action: 'commit', createdAt: '2021-09-01T14:34:16.779Z', state: { status: 'success', code: 0, description: 'action successful' }, id: 'f05f6b90-0726-49f7-8c79-f959eb5a6cf5', responseTo: '9c8ce2cb-c2eb-4f1f-bd7c-e0c3a541c671' }, trace: { startTimestamp: '2021-09-01T14:34:16.875Z', service: 'cl_transfer_position', traceId: '2eea686ac11f93e15a47ccff47ae69f3', spanId: 'fcdeefb7cf1a7cd1', parentSpanId: '0ef90aea045b5e1c', tags: { tracestate: 'mojaloop=eyJzcGFuSWQiOiJmY2RlZWZiN2NmMWE3Y2QxIiwidGltZUFwaUZ1bGZpbCI6IjE2MzA1MDY4NTY3NzUifQ==', transactionType: 'transfer', transactionAction: 'fulfil', transactionId: '9fb8e20c-7faa-465e-9927-bcc57637fe71', source: 'payeefsp', destination: 'testingtoolkitdfsp' }, tracestates: { mojaloop: { spanId: 'fcdeefb7cf1a7cd1', timeApiFulfil: '1630506856775' } } }, 'protocol.createdAt': 1630506856927 } }, size: 2660, key: null, topic: 'topic-notification-event', offset: 14, partition: 0, timestamp: 1630506856927 },
      type: 'application/json',
      metadata: { event: { id: '1fc36623-be91-42d0-ab9a-bc6db275c81f', type: 'audit', action: 'start', createdAt: '2021-09-01T14:34:16.946Z', state: { status: 'success' } }, trace: { service: 'cs_process_transfer_settlement_window', traceId: '2eea686ac11f93e15a47ccff47ae69f3', spanId: 'de4c896a06fac5f1', parentSpanId: 'fcdeefb7cf1a7cd1', startTimestamp: '2021-09-01T14:34:16.945Z', tags: { tracestate: 'mojaloop=eyJzcGFuSWQiOiJkZTRjODk2YTA2ZmFjNWYxIiwidGltZUFwaUZ1bGZpbCI6IjE2MzA1MDY4NTY3NzUifQ==', transactionType: 'transfersettlement', transactionAction: 'processing', transactionId: '9fb8e20c-7faa-465e-9927-bcc57637fe71', source: 'payeefsp', destination: 'testingtoolkitdfsp' } }, 'protocol.createdAt': 1630506856948 }
    }
  })

  it('Determine event is of type: audit', () => {
    const msg = unprocessedQuote

    const result = isAudit(msg)
    expect(result).toBeTruthy()
  })

  it('Determine transformation', () => {
    const msg = unprocessedQuote

    const expected = {
      event: unprocessedQuote,
      metadata: {
        reporting: {
          transactionId: '9fb8e20c-7faa-465e-9927-bcc57637fe71',
          eventType: eventType.QUOTE
        }
      }
    }
    const transformed = transformEvent(msg, eventType.QUOTE)
    expect(transformed).toEqual(expected)
  })

  it('Determine eventType: Quote', () => {
    const msg = unprocessedQuote

    const determined = determineEventType(msg)
    expect(determined).toEqual(eventType.QUOTE)
  })

  it('Determine eventType: Transfer', () => {
    const msg = unprocessedTransfer

    const determined = determineEventType(msg)
    expect(determined).toEqual(eventType.TRANSFER)
  })

  it('Determine eventType: Settlement', () => {
    const msg = unprocessedSettlement

    const determined = determineEventType(msg)
    expect(determined).toEqual(eventType.SETTLEMENT)
  })

  it('Determine eventType: Unsupported', () => {
    const msg = { Test: "Data" }

    const determined = determineEventType(msg)
    expect(determined).toEqual(eventType.UNSUPPORTED)
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
