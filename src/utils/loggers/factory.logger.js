import {createLogger, format, transports} from 'winston'
import {levelNames, SPLAT_SYMBOL, winstonLevels} from './constants.logger'
import {colorizeMessage, commonLogFormat, exactLogLevelMatch, printLog, unsetConsoleTransportFlag} from './fromats'
import {getMinLogLevel} from './utils.logger'

class DefaultLoggerFactory {
	constructor(logsRootPath) {
		this.logRootPath = logsRootPath
	}

	getDefaultLoggerTransports() {
		return this.logRootPath ? this.createFileTransports() : this.createConsoleTransports()
	}

	getDefaultLoggerFormat() {
		return this.logRootPath
			? format.combine(
				unsetConsoleTransportFlag,
				commonLogFormat,
			)
			: format.combine(commonLogFormat)
	}

	// eslint-disable-next-line class-methods-use-this
	createConsoleTransports = () => {
		return [
			...levelNames.map(({level}) => new transports.Console({
				level: getMinLogLevel(level),
				format: format.combine(
					exactLogLevelMatch(level),
					colorizeMessage,
					printLog,
				),
			})),
		]
	}

	createFileTransports = () => {
		return [
			...levelNames.map(({level}) => new transports.File({
				level: getMinLogLevel(level),
				filename: `${this.logRootPath}/${level}.log`,
				format: format.combine(
					exactLogLevelMatch(level),
					printLog,
				),
			})),
			new transports.File({
				level: getMinLogLevel(),
				filename: `${this.logRootPath}/all.log`,
				format: printLog,
			}),
		]
	}
}

export default logStoragePath => {
	const loggerFactory = new DefaultLoggerFactory(logStoragePath)

	const lgr = createLogger({
		level: getMinLogLevel(),
		levels: winstonLevels,
		format: loggerFactory.getDefaultLoggerFormat(),
		transports: loggerFactory.getDefaultLoggerTransports(),
	})

	lgr.error = (err, ...others) => {
		if (err instanceof Error) {
			lgr.log({level: 'error', message: `${err.stack || err}`, [SPLAT_SYMBOL]: others})
		} else {
			lgr.log({level: 'error', message: err, [SPLAT_SYMBOL]: others})
		}
	}

	return lgr
}

export const createConsoleLogger = () => {
	return createLogger({
		level: getMinLogLevel(),
		levels: winstonLevels,
		transports: new transports.Console({
			level: getMinLogLevel(),
			format: printLog,
		}),
		format: format.combine(
			commonLogFormat,
			colorizeMessage,
		),
	})
}
