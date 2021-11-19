const { getSettlementReportParams } = require('../../../src/custom-transformations/settlement-report-params')
const { msgWithNoService } = require('../data/sample-events')

describe('getSettlementReportParams', () => {

  it('Message with no service', () => {
    const result = getSettlementReportParams(msgWithNoService)
    expect(result).toEqual({})
  })

})
