const schema = {
  bsonType: 'object',
  required: ['event', 'metadata'],
  properties: {
    event: {
      bsonType: 'object',
      required: ['id', 'content', 'type', 'metadata'],
      properties: {
        id: {
          bsonType: 'string'
        },
        content: {
          bsonType: 'object'
        },
        type: {
          bsonType: 'string'
        },
        metadata: {
          bsonType: 'object',
          required: ['event', 'trace'],
          properties: {
            event: {
              bsonType: 'object',
              required: ['id', 'type', 'action', 'createdAt', 'state'],
              properties: {
                id: {
                  bsonType: 'string'
                },
                type: {
                  bsonType: 'string'
                },
                action: {
                  bsonType: 'string'
                },
                createdAt: {
                  bsonType: 'string'
                },
                state: {
                  bsonType: 'object',
                  properties: {
                    status: {
                      bsonType: 'string'
                    }
                  }
                }
              }
            },
            trace: {
              bsonType: 'object',
              required: ['service', 'tags'], /* traceId, spanId, startTimestamp */
              properties: {
                service: {
                  bsonType: 'string'
                },
                traceId: {
                  bsonType: 'string'
                },
                spanId: {
                  bsonType: 'string'
                },
                startTimestamp: {
                  bsonType: 'string'
                },
                tags: {
                  bsonType: 'object',
                  required: ['tracestate', 'transactionType', 'transactionAction', 'source'], /* destination */
                  properties: {
                    tracestate: {
                      bsonType: 'string'
                    },
                    transactionType: {
                      bsonType: 'string'
                    },
                    transactionAction: {
                      bsonType: 'string'
                    },
                    transactionId: {
                      bsonType: 'string'
                    },
                    source: {
                      bsonType: 'string'
                    },
                    destination: {
                      bsonType: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    metadata: {
      bsonType: 'object',
      required: ['reporting'],
      properties: {
        reporting: {
          bsonType: 'object',
          required: ['eventType'], /* "quoteId" */
          properties: {
            transactionId: {
              bsonType: 'string'
            },
            quoteId: {
              bsonType: 'string'
            },
            transferId: {
              bsonType: 'string'
            },
            settlementId: {
              bsonType: 'string'
            },
            settlementWindowId: {
              bsonType: 'string'
            },
            eventType: {
              enum: ['Quote', 'Transfer', 'Settlement', 'FxQuote', 'FxTransfer']
            }
          }
        }
      }
    }
  }
}

module.exports = { schema }
