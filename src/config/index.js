import configLibrary from 'config'
import _ from 'lodash'
import os from 'os'

const get = configLibrary.get.bind(configLibrary)
const has = configLibrary.has.bind(configLibrary)

export function screamingCaseEachProperty(obj) {
	return _.mapKeys(obj, (value, key) => _.snakeCase(key).toUpperCase())
}

const config = {
	ENV: process.env.NODE_ENV,
	SERVER: {
		PORT: get('server.port'),
		NAME: get('server.name'),
		HOST_NAME: os.hostname(),
		PROTOCOL_ADDRESS: has('server.protocol-address') ? get('server.protocol-address') : '',
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
	APP: {
		APPS_BACKUPS_PATH: `${get('app.backup-path')}`,
		APPS_EXECUTABLE_PATH: `${get('app.apps-executable-path')}`,
		APPS_DATA_PATH: `${get('app.apps-data-path')}`,
		NGINX: screamingCaseEachProperty(get('app.nginx')),
		ASSIGNABLE_PORTS_RANGE: get('app.assignablePortsRange'),
		CODE_BUILDER: {
			ARTIFACTS_DIR: get('app.artifacts-dir'),
			CODEBASE_DIR: get('app.codebase-dir'),
		},
	},
	DATABASES: get('databases'),
	DEPLOYMENT_AUTHENTICATION_MECHANISM: get('deploymentAuthenticationMechanism'),
	USER: get('user'),
}

export default config

export const SERVER_CONFIG = config.SERVER
export const LOGGING_CONFIG = config.LOGGING
export const API_CONFIG = config.API
export const APP_CONFIG = config.APP
export const DATABASES_CONFIG = config.DATABASES
export const {DEPLOYMENT_AUTHENTICATION_MECHANISM} = config
export const {USER} = config

/*
	Can't use localDevEnv NODE_ENV name as 'local' or 'local-development' while devEnv NODE_ENV name as 'development'
	This is because of file load order
	Refer:https://github.com/node-config/node-config/wiki/Configuration-Files
*/
export const isLocalDevEnv = config.ENV === 'locdev'
export const isDevEnv = config.ENV === 'development' || isLocalDevEnv

export const DATE_FORMAT = 'DD-MM-YYYY HH:mm:ss.SSS'
