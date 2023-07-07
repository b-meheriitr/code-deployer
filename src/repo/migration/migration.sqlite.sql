CREATE TABLE IF NOT EXISTS "app-port"
(
    id        INTEGER      NOT NULL
        PRIMARY KEY AUTOINCREMENT,
    hostName  VARCHAR(64)  NOT NULL,
    port      INTEGER      NOT NULL,
    appId     varchar(128) NOT NULL,
    createdOn datetime,
    updatedOn datetime,

    CONSTRAINT idx_unique_columns_hostName_port UNIQUE (hostName, port)
);

CREATE TABLE IF NOT EXISTS main."app"
(
    id              TEXT NOT NULL
        PRIMARY KEY,
    appName         TEXT NOT NULL,
    package         TEXT,
    appAbsolutePath TEXT NOT NULL,
    backupPath      TEXT NOT NULL,
    dataPath        TEXT NOT NULL,
    nginxRoutePath  TEXT NOT NULL
        UNIQUE,
    createdOn       DATETIME,
    updatedOn       DATETIME
);
