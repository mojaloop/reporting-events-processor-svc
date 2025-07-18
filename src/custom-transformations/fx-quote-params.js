const getFxQuoteParams= (msg) => {
  const fxQuoteParams= {}

  // if the service is ml_fxTransfer_prepare then return the determiningTransferId else return the transactionId
  if (msg.metadata?.trace?.service) {
    if(msg.metadata.trace.service === 'qs_fxQuote_forwardFxQuoteRequest'){
      if(msg.content?.payload){
        fxQuoteParams.transactionId = msg.content.payload?.conversionRequestId
      }
      else if(msg.content?.data){
        const data = JSON.parse(msg.content.data)
        fxQuoteParams.transactionId = data.conversionRequestId
      }
    }else if(msg.metadata.trace.tags?.transactionId)
      fxQuoteParams.transactionId = msg.metadata.trace.tags?.transactionId
  }

  Object.keys(fxQuoteParams).forEach(key => {
    if (fxQuoteParams[key] === undefined) {
      delete fxQuoteParams[key]
    }
  })

  return fxQuoteParams
}

module.exports = { getFxQuoteParams }

