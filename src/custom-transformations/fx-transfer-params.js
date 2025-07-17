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

  if (fxTransferParams.transactionId === undefined) {
    delete fxTransferParams.transactionId
  }

  return fxTransferParams
}

module.exports = { getFxTransferParams }
