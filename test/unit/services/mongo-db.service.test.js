const { MongoClient } = require('mongodb')
const { createReportingSchema, applySchema } = require('../../../src/utilities/mongodb-schema.js')
const { MongoDBService } = require('../../../src/services/mongo-db.service.js')

jestMongoURL = process.env.MONGO_URL;

describe('MongoDB Functionality', () => {

  beforeAll(async () => {
    
    console.debug(`Testing done on ${jestMongoURL}`)
    connection = await MongoClient.connect(jestMongoURL, {
      useNewUrlParser: true
    })
    db = await connection.db('Test')

    processedQuote = {
      event: {
        id: 'a31f3937-1ae0-4a2e-9d40-ad025a8fe5dd',
        content: { headers: { 'content-type': 'application/vnd.interoperability.quotes+json;version=1.0', accept: 'application/vnd.interoperability.quotes+json;version=1.0', date: 'Wed, 01 Sep 2021 14:34:15 GMT', 'fspiop-source': 'testingtoolkitdfsp', authorization: '{$inputs.TTK_BEARER_TOKEN}', 'fspiop-destination': 'payeefsp', traceparent: '00-aabb2a667dd4e2d3d96c241a0656a888-0123456789abcdef0-00', 'user-agent': 'axios/0.21.1', 'content-length': '600', host: 'test1-quoting-service', connection: 'keep-alive' }, payload: { transactionReferenceId: '9fb8e20c-7faa-465e-9927-bcc57637fe71', transactionInitiatorTypeId: 1, transactionInitiatorId: 1, transactionScenarioId: 1, amountTypeId: 2, quoteId: '31782ab9-de5a-4bd3-910a-f663d3ed91b9', payerId: 1, payeeId: 2 } },
        type: 'application/json',
        metadata: { event: { id: '2b1fce52-f481-4ab9-8d6a-9f7e281a8efe', type: 'audit', action: 'start', createdAt: '2021-09-01T14:34:16.163Z', state: { status: 'success' } }, trace: { service: 'qs_quote_forwardQuoteRequest', traceId: 'aabb2a667dd4e2d3d96c241a0656a888', spanId: '32b542b3bef07f34', parentSpanId: '8e800de677de94a8', sampled: 0, flags: 0, startTimestamp: '2021-09-01T14:34:16.162Z', tags: { tracestate: 'mojaloop=eyJzcGFuSWQiOiIzMmI1NDJiM2JlZjA3ZjM0In0=', transactionType: 'quote', transactionAction: 'prepare', transactionId: '9fb8e20c-7faa-465e-9927-bcc57637fe71', quoteId: '31782ab9-de5a-4bd3-910a-f663d3ed91b9', source: 'testingtoolkitdfsp', destination: 'payeefsp', payeeFsp: 'payeefsp', payerFsp: 'testingtoolkitdfsp' } }, 'protocol.createdAt': 1630506856165 }
      },
      metadata: {
        reporting: {
          transactionId: '9fb8e20c-7faa-465e-9927-bcc57637fe71',
          eventType: 'Quote'
        }
      }
    }
  })

  afterAll(async () => {
    await connection.close()
  })

  it('Test Connection', async () => {
    const res = await db.command({ ping: 1 })
    expect(res.ok).toEqual(1)
  })

  it('Insert any data without schema', async () => {
    const testCollection = db.collection('data')

    const mockData = { name: 'SomeString1234' }
    await testCollection.insertOne(mockData)

    const insertedData = await testCollection.findOne({ name: 'SomeString1234' })
    expect(insertedData).toEqual(mockData)
  })

  it('Applied schema on existing collection', async () => {
    const testCollection = db.collection('data')
    await applySchema(connection, 'Test', 'data')

    const validMockData = processedQuote
    await testCollection.insertOne(validMockData)

    const insertedData = await testCollection.findOne({ 'event.metadata.event.id': '2b1fce52-f481-4ab9-8d6a-9f7e281a8efe' })
    expect(insertedData).toEqual(validMockData)
  })

  it('Applied schema on existing collection (error handling)', async () => {
    const testCollection = db.collection('data')
    await applySchema(connection, 'Test', 'data')

    const invalidMockData = { name: 'SomeString12345' }
    try {
      await testCollection.insertOne(invalidMockData)
    } catch (err) {
      expect.stringContaining('MongoServerError: Document failed validation')
    }
  })

  it('Applied schema on new collection', async () => {
    const testCollection = db.collection('newDataOne')
    await createReportingSchema(connection, 'Test', 'newDataOne')

    const validMockData = processedQuote
    await testCollection.insertOne(validMockData)

    const insertedData = await testCollection.findOne({ 'event.metadata.event.id': '2b1fce52-f481-4ab9-8d6a-9f7e281a8efe' })
    expect(insertedData).toEqual(validMockData)
  })

  it('Applied schema on new collection (error handling)', async () => {
    const testCollection = db.collection('newDataTwo')
    await createReportingSchema(connection, 'Test', 'newDataTwo')

    const invalidMockData = { name: 'SomeString12345' }
    try {
      await testCollection.insertOne(invalidMockData)
    } catch (err) {
      expect.stringContaining('MongoServerError: Document failed validation')
    }
  })

  it('Initialize service first time', async () => {
    mongodbService = new MongoDBService(jestMongoURL)
    const result = await mongodbService.initialize()

    expect(result).toEqual(true);
  })

  it('Initialize service existing', async () => {
    const kafkaCollection = db.collection('reportingData')

    const validMockData = processedQuote
    await kafkaCollection.insertOne(validMockData)

    mongodbService = new MongoDBService(jestMongoURL)
    const result = await mongodbService.initialize()

    expect(result).toEqual(true);
  })


  it('Initialize service: unable to connect', async () => {

    const spyConnect = jest
      .spyOn(MongoClient.prototype, 'connect')
      .mockImplementation(() => { true });

    const spyDb = jest
      .spyOn(MongoClient.prototype, 'db')
      .mockImplementation((properties) => {
        command: jest.fn().mockImplementation(() => { 0 })
      });

    const spyClose = jest
      .spyOn(MongoClient.prototype, 'close')
      .mockImplementation(() => { });


    mongodbService = new MongoDBService('mongodb://SomeFakeMongoURL')
    //mongodbService = new MongoDBService(jestMongoURL)
    const result = await mongodbService.initialize()

    console.log(result);
    expect(result).toEqual(false);
    expect(spyConnect).toHaveBeenCalledTimes(1)
    expect(spyClose).toHaveBeenCalledTimes(1)

    spyConnect.mockReset();
    spyDb.mockReset();
    spyClose.mockReset();
  })

  it('SavetoDB', async () => {
    const spyInsert = jest
      .spyOn(MongoClient.prototype, 'db')
      .mockImplementation(() => {
        return {
          collection: () => {
            return {
              insertOne: () => { Promise.resolve(true) }
            }
          }
        }
      });

    const spyConnect = jest
      .spyOn(MongoClient.prototype, 'connect')
      .mockImplementation(() => { true });


    const spyClose = jest
      .spyOn(MongoClient.prototype, 'close')
      .mockImplementation(() => { });

    mongodbService = new MongoDBService('mongodb://SomeFakeMongoURL')
    await mongodbService.initialize()

    const mockRecord = { name: 'test' };

    const result = await mongodbService.saveToDB(mockRecord);

    expect(result).toBeDefined();
    expect(result).toEqual(true);
    expect(spyClose).toHaveBeenCalledTimes(2) //once in mongodbService.initialize() and once in mongodbService.saveToDB()
    spyInsert.mockReset();
    spyConnect.mockReset();
    spyClose.mockReset();
  })
})
