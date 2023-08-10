import {now} from './utils'

export function beforeCreate(attributes, options) {
	attributes.createdOn = now()
}

export function beforeUpdate(attributes, options) {
	attributes.updatedOn = now()
}
