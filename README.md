# Event Processor
Kafka consumer service for persistence storage of audit event logs.  

## Documentation
You can find detailed documentation about the concept at this page [Mojaloop Hub Operations Framework Documentation](https://docs.mojaloop.io/business-operations-framework-docs/guide/ReportingBC.html#building-the-event-data-store)

## Run Locally

**Prerequisites:**  
Install dependencies  
`npm install`  

Populate environmental values  
***.env*** from ***.env.template***  

**Run tests:**  
`npm run test`  
or for additional information   
`npm run test:coverage`  

**Start consumer:**  
`npm run start`