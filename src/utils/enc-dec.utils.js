/* eslint-disable global-require */
import {USER} from '../config'

export function encrypt(plainText) {
	return require('bcrypt').hash(plainText, USER.passwordSaltRounds)
}

export function compare(plainText, encryptedText) {
	return require('bcrypt').compare(plainText, encryptedText)
}
