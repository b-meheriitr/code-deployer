import path from 'path'
import {LOGGING_CONFIG} from '../../config'
import {winstonLevels} from './constants.logger'

export const centerPad = (str, len) => {
	const padLen = len - str.length
	const padStart = Math.floor(padLen / 2) + str.length
	return str.padStart(padStart, ' ').padEnd(len, ' ')
}

export const beautifyLogLevel = logLevel => centerPad(logLevel.toUpperCase(), 7)

export const filterOutNodeModuleStacks = err => {
	return err.stack.split('\n')
		.filter(msg => !msg.includes('node_modules'))
}

export const stackPathToRelativePath = stackLine => {
	const filePathInLineMatch = /^\s*at[^/]*(\/[^:]*)/.exec(stackLine)
	if (filePathInLineMatch) {
		const absoluteFilePath = filePathInLineMatch[1]
		const relativeFilePath = path.relative(process.cwd(), absoluteFilePath)

		return stackLine.replaceAll(absoluteFilePath, relativeFilePath)
	}
	return stackLine
}

export const getMinLogLevel = (level = LOGGING_CONFIG.LEVEL) => {
	const APP_LOG_LEVEL = LOGGING_CONFIG.LEVEL

	return winstonLevels[APP_LOG_LEVEL] <= winstonLevels[level] ? APP_LOG_LEVEL : level
}
