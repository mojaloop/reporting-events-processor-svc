const getFxTransferParams = (msg) => {
  const fxTransferParams = {}

  if (msg.metadata?.trace?.service) {
    if (msg.metadata.trace.service === 'ml_fxTransfer_prepare') {
      if (msg.content?.payload) {
        fxTransferParams.transactionId = msg.content.payload.commitRequestId
      }
    } else if (msg.metadata.trace.tags?.transactionId) {
      fxTransferParams.transactionId = msg.metadata.trace.tags?.transactionId
    }
  }

  Object.keys(fxTransferParams).forEach(key => {
    if (fxTransferParams[key] === undefined) {
      delete fxTransferParams[key]
    }
  })

  return fxTransferParams
}

module.exports = { getFxTransferParams }
