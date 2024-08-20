import {DEPLOYMENT_AUTHENTICATION_MECHANISM} from '../config'
import AUTHENTICATION_MECHANISMS from '../consts/authentication-mechanism'
import * as deploymentAuthenticationService from '../services/deploymentAuthentication.service'
import {sendMessage} from '../utils/utils'

export async function deploymentAuthentication(req, res, next) {
	res.setHeader('Content-Type', 'text/event-stream')
	res.setHeader('Cache-Control', 'no-cache')
	res.setHeader('Connection', 'keep-alive')

	const [record, authenticatedPoller] = await deploymentAuthenticationService.createAuthenticationSession(req)

	// todo
	sendMessage(res, `Authenticate on http://localhost/8080/${record.sessionId}`, 'authentication-required')

	return authenticatedPoller
		.then(() => {
			sendMessage(res, 'Authentication successful', 'authentication-successful')
			next()
		})
		.catch(e => {
			sendMessage(res, e.message, 'authentication-failed')
			throw e
		})
}

const SUPPORTED_DEPLOYMENT_AUTH_MECHANISMS = Object.values(AUTHENTICATION_MECHANISMS)

if (DEPLOYMENT_AUTHENTICATION_MECHANISM && !SUPPORTED_DEPLOYMENT_AUTH_MECHANISMS.includes(DEPLOYMENT_AUTHENTICATION_MECHANISM)) {
	throw new Error(`Deployment Authentication Mechanism: ${DEPLOYMENT_AUTHENTICATION_MECHANISM} not supported.
			Please use any of ${DEPLOYMENT_AUTHENTICATION_MECHANISM.join(', ')}
	`)
}
