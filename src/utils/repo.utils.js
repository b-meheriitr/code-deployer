export function beforeCreate(attributes, options) {
	attributes.createdOn = new Date()
}

export function beforeUpdate(attributes, options) {
	attributes.updatedOn = new Date()
}
