const getSettlementReportParams = (msg) => {
  const reportingParams = {}

  if (msg.metadata?.trace?.service) {
    if (msg.metadata.trace.service === 'updateSettlementById') {
      if (msg.metadata.trace.tags?.transactionId.startsWith('sid=')) {
        reportingParams.settlementId = msg.metadata.trace.tags.transactionId.split('=')[1]
      }
    } else if (msg.metadata.trace.service === 'createSettlement') {
      reportingParams.settlementId = msg.metadata.trace.tags?.transactionId
    } else if (msg.metadata.trace.service === 'cs_close_settlement_window') {
      reportingParams.settlementWindowId = msg.metadata.trace.tags?.transactionId
    } else if (msg.metadata.trace.service === 'closeSettlementWindow') {
      if (msg.metadata.trace.tags?.transactionId.startsWith('settlementWindowId=')) {
        reportingParams.settlementWindowId = msg.metadata.trace.tags.transactionId.split('=')[1]
      }
    }
  }

  Object.keys(reportingParams).forEach(key => {
    if (reportingParams[key] === undefined) {
      delete reportingParams[key]
    }
  })

  return reportingParams
}

module.exports = { getSettlementReportParams }
