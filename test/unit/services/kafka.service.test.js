const { createHandler } = require('@mojaloop/central-services-stream').Util.Consumer
const { KafkaService } = require('../../../src/services/kafka.service.js')

jest.mock('@mojaloop/central-services-stream', () => {
  return {
    Util: {
      Consumer: {
        createHandler: jest.fn()
      }
    }
  }
})

jest.useFakeTimers()

describe('Kafka Service', () => {
  beforeEach(() => {
    createHandler.mockImplementation((args) => {
      return {
        testArgs: args
      };
    });
  })

  afterEach(() => {
    createHandler.mockReset();
  })

  it('Constructor sets values', () => {
    const kafkaService = new KafkaService();
    const result = { initialized: false, kafkaClient: undefined };

    expect(kafkaService).toEqual(result)
  })

  it('Initialize service', () => {
    const kafkaService = new KafkaService()
    kafkaService.initialize()

    expect(kafkaService.initialized).toBeTruthy();
  })

  it('Initialize service, kafka failure', () => {
    const kafkaClient = createHandler;
    const expectedErrorMessage = 'Kafka Test Error'

    kafkaClient.mockImplementation((args) => {
      throw new Error(expectedErrorMessage)
    })

    const kafkaService = new KafkaService()

    try {
      kafkaService.initialize()
    }
    catch (err) {
      expectedError = err;
      expect(expectedError).toBeDefined()
    }
  })

  it('startConsumer', async () => {
    const kafkaService = new KafkaService()
    kafkaService.initialize()
    kafkaService.startConsumer()
    expect(createHandler).toHaveBeenCalledTimes(1);
    expect(createHandler).toHaveBeenCalledWith(
      'topic-event-audit',
      {
        rdkafkaConf: {
          metadataBrokerList: 'localhost:9092',
          clientId: 'reporting_events_processor_consumer',
          groupId: 'reporting_events_processor_consumer_group',
          socketKeepaliveEnable: true,
        }
      },
      undefined
    );
  })

  it('startConsumer with an exception', async () => {
    const kafkaService = new KafkaService()
    kafkaService.initialize()

    createHandler.mockImplementation(() => {
      throw new Error('test error')
    })

    await expect(kafkaService.startConsumer()).rejects.toThrowError()
  })

})
