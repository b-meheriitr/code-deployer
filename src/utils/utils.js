import moment from 'moment'
import * as util from 'util'
import {v4 as uuidv4} from 'uuid'
import {DATE_FORMAT} from '../config'
import {AppIdNotPresentInHeadersError} from '../errors/errors'

export const uuid = () => uuidv4()

export function throwIfNull(value, errSupplier) {
	if (value) {
		return value
	}

	throw errSupplier()
}

export const toWhiteSpaceSeparatedString = array => {
	return array.filter(Boolean)
		.map(item => util.format(item))
		.join(', ')
}

export const now = () => moment()

export const dateString = (format = DATE_FORMAT) => moment().format(format)

export function toLocalDateString(date) {
	return date && moment.utc(date)
		.local()
		.format(DATE_FORMAT)
}

export function getAppId(req) {
	const appId = req.headers['app-name']
	if (!appId) {
		throw new AppIdNotPresentInHeadersError()
	}
	return appId
}

export function getPackagePath(packageName) {
	return (packageName || '/').replace(/\./g, '/')
}

export function sendMessage(res, message, messageTag = 'message') {
	res.write(`${messageTag}: ${message}`)
}

export function sendJsonCheckingHeadersSent({res, status, json}) {
	if (res.headersSent) {
		json.apiStatus = status
		sendMessage(res, JSON.stringify(json), status >= 200 && status < 300 ? 'message' : 'error')
		res.end()
	} else {
		res.status(status).json(json)
	}
}

export function removeRedundantPortFromUrl(urlString) {
	try {
		const url = new URL(urlString)
		if (url.port
			&& ((url.protocol === 'http:' && url.port === '80') || (url.protocol === 'https:' && url.port === '443'))) {
			url.port = ''
		}
		return url.toString()
	} catch (err) {
		throw new Error('Invalid URL:', err.message)
	}
}
