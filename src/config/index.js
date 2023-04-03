import configLibrary from 'config'

const get = configLibrary.get.bind(configLibrary)

const config = {
	ENV: process.env.NODE_ENV,
	SERVER: {
		PORT: get('server.port'),
		NAME: get('server.name'),
	},
	LOGGING: {
		OVERRIDE_GLOBAL_CONSOLE_METHODS: get('logging.override-global-console-methods'),
		FILE_LOGGING: get('logging.file-logging'),
		FILE_TRANSPORT_ROOT_PATH: get('logging.file-transport-root-path'),
		LEVEL: get('logging.level'),
		SKIP_MORGAN_REQUESTS_LOG: get('logging.skip-morgan-requests-log'),
	},
	API: {
		BASE_PATH: get('api.base-path'),
	},
}

export default config

export const SERVER_CONFIG = config.SERVER
export const LOGGING_CONFIG = config.LOGGING
export const API_CONFIG = config.API

/*
	Can't use localDevEnv NODE_ENV name as 'local' or 'local-development' while devEnv NODE_ENV name as 'development'
	This is because of file load order
	Refer:https://github.com/node-config/node-config/wiki/Configuration-Files
*/
export const isLocalDevEnv = config.ENV === 'locdev'
export const isDevEnv = config.ENV === 'development' || isLocalDevEnv

export const DATE_FORMAT = 'DD-MM-YYYY HH:mm:ss.SSS'
