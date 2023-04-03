import winston from 'winston'
import {LOGGING_CONFIG} from '../../config'
import {winstonLevelColors} from './constants.logger'
import createDefaultLogger, {createLoggerOverridingConsole} from './factory.logger'

winston.addColors(winstonLevelColors)

export default createDefaultLogger(
	LOGGING_CONFIG.FILE_LOGGING
		? LOGGING_CONFIG.FILE_TRANSPORT_ROOT_PATH
		: undefined,
)
export const loggerOverrideGlobalConsole = createLoggerOverridingConsole()

if (LOGGING_CONFIG.OVERRIDE_GLOBAL_CONSOLE_METHODS) {
	['info', 'debug', 'error', 'warn', 'trace']
		.forEach(logLevel => {
			// eslint-disable-next-line no-console
			console[logLevel] = function () {
				// eslint-disable-next-line prefer-rest-params
				loggerOverrideGlobalConsole[logLevel](...arguments)
			}
		})
}
