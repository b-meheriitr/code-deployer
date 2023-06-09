CREATE TABLE IF NOT EXISTS `app-port`
(
    id        INT AUTO_INCREMENT
        PRIMARY KEY,
    hostName  VARCHAR(64)  NOT NULL,
    port      INT          NOT NULL,
    appId     VARCHAR(128) NOT NULL,
    createdOn DATETIME,
    updatedOn DATETIME,
    CONSTRAINT idx_unique_columns_hostName_port
        UNIQUE (hostName, port)
);
