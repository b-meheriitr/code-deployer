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

CREATE TABLE IF NOT EXISTS main.sqlite_master
(
    type     TEXT,
    name     TEXT,
    tbl_name TEXT,
    rootpage INT,
    sql      TEXT
);
