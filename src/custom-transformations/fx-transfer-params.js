const getFxTransferParams = (msg) => {
  const fxTransferParams= {}

  // if the service is ml_fxTransfer_prepare then return the commitRequestId else return the transactionId
  if (msg.metadata?.trace?.service) {
    if(msg.metadata.trace.service === 'ml_fxTransfer_prepare'){
      if(msg.content?.payload){
        fxTransferParams.transactionId = msg.content.payload.commitRequestId
      }
      
    }else if(msg.metadata.trace.tags?.transactionId)
      fxTransferParams.transactionId = msg.metadata.trace.tags?.transactionId
  }     
  
  return fxTransferParams 
}

module.exports = { getFxTransferParams }
