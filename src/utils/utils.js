import moment from 'moment'
import * as util from 'util'
import {v4 as uuidv4} from 'uuid'
import {DATE_FORMAT} from '../config'

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

export const dateString = (format = DATE_FORMAT) => moment().format(format)
