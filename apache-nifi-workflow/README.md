We are using Apache Nifi service to construct reporting information.
And the workflow file `flow.json` is maintained in this repository.
The Nifi service downloads the workflow file from this repository and executes the workflow.

# Instructions to start apache nifi and configuration steps

Run `apache nifi`

## Pre-requisites

- git
- docker
- docker-compose

## Starting mojaloop core services 

Execute the following commands to run mojaloop in local machine to boot up Finance portal

```bash
git clone https://github.com/mojaloop/ml-core-test-harness.git
cd ml-core-test-harness
docker-compose --profile all-services --profile fx --profile finance-portal --profile ttk-provisioning-fx --profile ttk-fx-tests --profile debug up -d
```

Wait for some time to get all the containers up and healthy.
You can check the status of the containers using the command `docker ps`.

## Opening apache nifi in web browser

Once the `finance-portal` profile is running and is in healthy state.

1. Open the URL `https://localhost:8443/nifi`
2. Enter the following credentials:
    - Username: `admin`
    - Password: `password@1234`

This will open the apache nifi web interface and you can take a look at the flows defined and running

## Copying JDBC Drivers for Java Database Connections
1. Download JDBC Driver: Obtain the JDBC driver for your database (e.g., MySQL, MongoDB, or PostgreSQL).
   - For MySQL, download the driver from `MySQL Connector/J`.
2. Copy the Driver:
   - Locate your NiFi configuration directory.
   - Copy the `.jar` file of the JDBC driver to the `nifi-drivers` folder inside the ml-core-test-harness directory:
      ```bash
      cp /path/to/your-jdbc-driver.jar /path/to/nifi-drivers
      ```
## Creating a Processor in NiFi
1. Open the NiFi web interface.
2. Drag and drop a processor onto the canvas.
3. In the processor selection dialog, search for and select a database-related processor:
   - For querying databases: `ExecuteSQL`, `QueryDatabaseTable`.
   - For inserting data: `PutDatabaseRecord`.
4. Configure the processor:
   - Right-click the processor and choose Configure.
   - Set the necessary properties such as the Database Connection Pooling Service, SQL query, and other parameters.

## Configuring Database Connection in NiFi
1. Add a Database Connection Pooling Service:
   - Right-click on the canvas and click on the configure option.
   - Then go to the controller services tab.
   - Add a new service of type `DBCPConnectionPool` (or any other as per the use case).
2. Configure the Connection Pooling Service:
   - Click the wrench icon to edit the service properties.
   - Set the following properties:
     - Database Connection URL: Provide the JDBC URL (e.g., `jdbc:mysql://hostname:port/database`).
     - Database Driver Class Name: Specify the driver class (e.g., `com.mysql.cj.jdbc.Driver` for MySQL).
     - Database Driver Location(s): Path to the JDBC driver JAR.
     - Username: Database username. These are provided through the env variables at the moment
     - Password: Database password. These are provided through the env variables at the moment
3. Enable the Controller Service:
   - After saving the configuration, click the lightning bolt icon to enable the service.
4. Status:
   - If the status of the service is enabled then the service connected successfully, if it is enabling check for errors 
     that show up on top right side of the controller when you click on it.

## Update nifi configuration

Following are the environment variables that are being used at the moment and can be updated
- `SINGLE_USER_CREDENTIALS_USERNAME` Sets the username for the user login
- `SINGLE_USER_CREDENTIALS_PASSWORD` Sets the password for the user login , password must be minimum 12 characters.
- `MONGO_CONNECTION_URI` URL for the mongodb connection used by the connection service in nifi
- `MYSQL_CONNECTION_URI` URL for the mysql conncetion used by the connection service in nifi
