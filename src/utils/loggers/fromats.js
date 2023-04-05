import chalk from 'chalk'
import {format} from 'winston'
import {SERVER_CONFIG} from '../../config'
import {dateString, toWhiteSpaceSeparatedString} from '../utils'
import {SPLAT_SYMBOL} from './constants.logger'
import {LoggerConfig} from './models.logger'
import {beautifyLogLevel, centerPad} from './utils.logger'

export const printLog = format.printf(({level, message, label, timeStamp, requestId, consoleTransport, config}) => {
	if (config.messageOnly) {
		return message
	}

	let coloredTimeStamp
	let coloredLabel
	let coloredReqId
	let coloredLevel

	if (consoleTransport) {
		coloredTimeStamp = chalk.greenBright.bold(timeStamp)
		coloredLabel = chalk.italic.cyan(centerPad(label), 10)
		coloredReqId = chalk.magenta(requestId)
		coloredLevel = chalk.rgb(255, 136, 0).bold(beautifyLogLevel(level))
	} else {
		coloredTimeStamp = timeStamp
		coloredLabel = centerPad(label, 10)
		coloredReqId = requestId
		coloredLevel = beautifyLogLevel(level)
	}

	return `${coloredTimeStamp} | ${coloredLabel} | ${coloredReqId} | ${coloredLevel} -> ${message}`
})

export const colorizeMessage = format.colorize({message: true})

export const unsetConsoleTransportFlag = format(info => {
	info.consoleTransport = false
	return info
})()

export const extractConfig = format(info => {
	if (info[SPLAT_SYMBOL]) {
		info.config = info[SPLAT_SYMBOL].find(splat => (splat instanceof LoggerConfig)) || {}
		info[SPLAT_SYMBOL] = info[SPLAT_SYMBOL].filter(splat => !(splat instanceof LoggerConfig))
	} else {
		info.config = {}
		info[SPLAT_SYMBOL] = []
	}

	return info
})()

export const buildMessage = format(info => {
	const allMessages = [info.message, ...info[SPLAT_SYMBOL]]

	info.message = toWhiteSpaceSeparatedString(allMessages)
	return info
})()

export const exactLogLevelMatch = level => {
	return format(info => {
		if (level === undefined || info.level === level) {
			return info
		}
		return false
	})()
}

export const setLogRequestInfo = format(info => {
	info.timeStamp = info.config.timeStamp || (
		info.config.useCurrentTime
			? dateString()
			: info.config.req?.timeStamp || dateString()
	)
	info.requestId = info.config.req?.requestId

	return info
})()

export const commonLogFormat = format.combine(
	extractConfig,
	format.errors({stack: true}),
	setLogRequestInfo,
	format.label({label: SERVER_CONFIG.NAME}),
	buildMessage,
)
