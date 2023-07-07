IF NOT EXISTS (SELECT *
               FROM sys.schemas
               WHERE name = 'code-deployer')
    BEGIN
        EXEC ('CREATE SCHEMA [code-deployer]');
    END


IF NOT EXISTS (SELECT *
               FROM sys.tables
               WHERE name = 'app-port')
    BEGIN
        CREATE TABLE [code-deployer].[app-port]
        (
            id        INT IDENTITY
                PRIMARY KEY,
            hostName  VARCHAR(64)  NOT NULL,
            port      INT          NOT NULL,
            appId     VARCHAR(128) NOT NULL,
            createdOn DATETIME,
            updatedOn DATETIME,
            CONSTRAINT UC_hostName_port
                UNIQUE (hostName, port)
        )
    END


IF NOT EXISTS (SELECT *
               FROM sys.tables
               WHERE name = 'app')
    BEGIN
        CREATE TABLE [code-deployer].[app]
        (
            id        INT IDENTITY
                PRIMARY KEY,
            appName         NVARCHAR(MAX) NOT NULL,
            package         NVARCHAR(MAX),
            appAbsolutePath NVARCHAR(MAX) NOT NULL,
            dataPath        NVARCHAR(MAX) NOT NULL,
            backupPath      NVARCHAR(MAX) NOT NULL,
            nginxRoutePath  NVARCHAR(256) NOT NULL
                UNIQUE,
            createdOn       DATETIME,
            updatedOn       DATETIME
        )
    END
