const { getSettlementReportParams } = require('../../../src/custom-transformations/settlement-report-params')
const { msgWithNoService, createSettlementMsg, csCloseSettlementWindowMsg, closeSettlementWindowMsg, updateSettlementByIdMsg } = require('../data/sample-events')

describe('getSettlementReportParams', () => {
  it('Message with no service', () => {
    const result = getSettlementReportParams(msgWithNoService)
    expect(result).toEqual({})
  })

  it('CreateSettlement message', () => {
    const result = getSettlementReportParams(createSettlementMsg)
    expect(result).toHaveProperty('settlementId')
    expect(result.settlementId).toEqual(createSettlementMsg.metadata.trace.tags?.transactionId)
  })

  it('cs_close_settlement_window message', () => {
    const result = getSettlementReportParams(csCloseSettlementWindowMsg)
    expect(result).toHaveProperty('settlementWindowId')
    expect(result.settlementWindowId).toEqual(csCloseSettlementWindowMsg.metadata.trace.tags?.transactionId)
  })

  it('closeSettlementWindow message', () => {
    const result = getSettlementReportParams(closeSettlementWindowMsg)
    expect(result).toHaveProperty('settlementWindowId')
    expect(result.settlementWindowId).toEqual('6')
  })

  it('updateSettlementById message', () => {
    const result = getSettlementReportParams(updateSettlementByIdMsg)
    expect(result).toHaveProperty('settlementId')
    expect(result.settlementId).toEqual('5')
  })

})
