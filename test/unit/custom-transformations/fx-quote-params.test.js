const { getFxQuoteParams } = require('../../../src/custom-transformations/fx-quote-params')
const { msgWithNoService } = require('../data/sample-events')
const { qs_fxQuote_forwardFxQuoteRequest_type2, qs_fxQuote_forwardFxQuoteRequest_type1, qs_fxQuote_forwardFxQuoteUpdate, FxQuotesByIdPut } = require('../data/sample-fx-events')

describe('getSettlementReportParams', () => {
  it('Message with no service', () => {
    const result = getFxQuoteParams(msgWithNoService)
    expect(result).toEqual({})
  })

  it('qs_fxQuote_forwardFxQuoteRequest with payload propety in content', () => {
  const result = getFxQuoteParams(qs_fxQuote_forwardFxQuoteRequest_type1)
  expect(result).toHaveProperty('transactionId')
  expect(result.transactionId).toEqual(qs_fxQuote_forwardFxQuoteRequest_type1.content.payload.conversionRequestId)
  })

  it('qs_fxQuote_forwardFxQuoteRequest with data propety in content', () => {
    const result = getFxQuoteParams(qs_fxQuote_forwardFxQuoteRequest_type2)
    const data = JSON.parse(qs_fxQuote_forwardFxQuoteRequest_type2.content.data)
    expect(result).toHaveProperty('transactionId')
    expect(result.transactionId).toEqual(data.conversionRequestId)
  })

  it('qs_fxQuote_forwardFxQuoteUpdate', () => {
    const result = getFxQuoteParams(qs_fxQuote_forwardFxQuoteUpdate)
    expect(result).toHaveProperty('transactionId')
    expect(result.transactionId).toEqual(qs_fxQuote_forwardFxQuoteUpdate.metadata.trace.tags.transactionId)
  })

  it('FxQuotesByIdPut', () => {
    const result = getFxQuoteParams(FxQuotesByIdPut)
    expect(result).toHaveProperty('transactionId')
    expect(result.transactionId).toEqual(FxQuotesByIdPut.metadata.trace.tags.transactionId)
  })
})
