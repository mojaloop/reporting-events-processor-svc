const { getFxTransferParams } = require('../../../src/custom-transformations/fx-transfer-params')
const { msgWithNoService } = require('../data/sample-events')
const { ml_fxTransfer_prepare, ml_fxTransfer_fulfill, ml_fxTransfer_patch, ml_fxTransfer_getById, ml_fxTransfer_abort } = require('../data/sample-fx-events')

describe('getSettlementReportParams', () => {
  it('Message with no service', () => {
    const result = getFxTransferParams(msgWithNoService)
    expect(result).toEqual({})
  })

  it('ml_fxTransfer_prepare', () => {
    const result = getFxTransferParams(ml_fxTransfer_prepare)
    expect(result).toHaveProperty('transactionId')
    expect(result.transactionId).toEqual(ml_fxTransfer_prepare.content.payload.commitRequestId)
  })

  it('ml_fxTransfer_fulfill', () => {
    const result = getFxTransferParams(ml_fxTransfer_fulfill)
    expect(result).toHaveProperty('transactionId')
    expect(result.transactionId).toEqual(ml_fxTransfer_fulfill.metadata.trace.tags.transactionId)
  })

  it('ml_fxTransfer_getById', () => {
    const result = getFxTransferParams(ml_fxTransfer_getById)
    expect(result).toHaveProperty('transactionId')
    expect(result.transactionId).toEqual(ml_fxTransfer_getById.metadata.trace.tags.transactionId)
  })

  // TODO: Implement for ml_fxTransfer_abort and ml_fxTransfer_patch

})
