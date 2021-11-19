const { Kafka } = require('kafkajs')
const { KafkaService } = require('../../../src/services/kafka.service.js')

jest.mock('kafkajs')

describe('Kafka Service', () => {
  beforeEach(() => {
    Kafka.mockImplementation((args) => {
      return {
        testArgs: args,
        consumer: jest.fn().mockImplementation((props) => { })
      };
    });
  })

  afterEach(() => {
    Kafka.mockReset();
  })

  it('Constructor sets values', () => {
    const kafkaService = new KafkaService();
    const result = { initialized: false, kafkaClient: undefined };

    expect(kafkaService).toEqual(result)
  })

  it('Initialize service', () => {
    const kafkaService = new KafkaService()
    kafkaService.initialize()

    expect(kafkaService.kafkaClient).toBeTruthy();
    expect(kafkaService.kafkaClient.testArgs).toEqual({
      brokers: ['localhost:9092'],
      clientID: 'example-producer'
    });
  })

  it('Initialize service, kafka failure', () => {
    const kafkaClient = Kafka;
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

    const mockConnect = jest.fn().mockImplementation(() => { Promise.resolve("connected") })
    const mockSubscribe = jest.fn().mockImplementation((props) => { Promise.resolve("subscribed") })
    const mockRun = jest.fn().mockImplementation((props) => { Promise.resolve("run") })

    const consumerSpy = jest
      .spyOn(kafkaService.kafkaClient, 'consumer')
      .mockImplementation((props) => {
        return {
          connect: mockConnect,
          subscribe: mockSubscribe,
          run: mockRun
        }
      })

    kafkaService.startConsumer()
    expect(consumerSpy).toHaveBeenCalledTimes(1);
  })
})
