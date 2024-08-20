import authenticationMechanism from '../consts/authentication-mechanism'
import {AuthenticationSessionNotfoundError, UserAuthenticationFailedError} from '../errors/errors'
import {userAuthenticationSessionRepo} from '../repo'
import {compare} from '../utils/enc-dec.utils'
import {now, rejectAtTime, throwIfNull, uuid} from '../utils/utils'
import * as userService from './user.service'

function pollForAuthenticated(record) {
	const [poller, cancelPoller] = (function () { // todo: extract to a different function
		let cancel
		const p1 = new Promise((resolve, reject) => {
			const pollingInterval = 500

			const intervalId = setInterval(async () => {
				try {
					const newRecord = await userAuthenticationSessionRepo.findById(record.sessionId)
					if (newRecord.authenticatedOn) {
						resolve()
					}

					if (newRecord.attemptsRemaining === 0) {
						reject(new Error('Maximum authentication attempts reached'))
					}
				} catch (e) {
					reject(new Error(`${e.message}\n${e.stack}`))
				}
			}, pollingInterval)

			cancel = () => clearInterval(intervalId)
		})
		return [p1, cancel]
	}())

	const [timeoutPromise, cancelTimeout] = rejectAtTime(record.expiresAt)

	return Promise.race([poller, timeoutPromise])
		.finally(() => {
			cancelPoller()
			cancelTimeout()
		})
}

function createSession(req) {
	const createTime = now()
	return userAuthenticationSessionRepo.insert({
		sessionId: uuid(),
		authenticationMechanism: null,
		expiresAt: createTime.add(3, 'minutes'),
		createdOn: createTime,
		requestId: req.requestId,
		authenticatedFomIp: req.clientIp,
		attemptsRemaining: 3,
	})
}

export async function createAuthenticationSession(req) {
	const record = await createSession(req)
	return [record, pollForAuthenticated(record)]
}

async function getSession(sessionId) {
	return throwIfNull(
		await userAuthenticationSessionRepo.findById(sessionId),
		() => new AuthenticationSessionNotfoundError(sessionId),
	)
}

export async function authenticate({sessionId, ...payload}) {
	const record = await getSession(sessionId)

	if (record.authenticatedOn) {
		throw new UserAuthenticationFailedError({
			reason: 'Already authenticated',
		})
	}

	if (record.expiresAt < now()) {
		throw new UserAuthenticationFailedError({
			reason: 'Session expired',
		})
	}

	if (record.attemptsRemaining <= 0) {
		throw new UserAuthenticationFailedError({
			reason: 'No more attempts remaining',
		})
	}

	// authentication logic
	const user = await userService.getUserByUserName(payload.username)

	if (!(await compare(payload.password, user.userPassword.password))) {
		const newRecord = await userAuthenticationSessionRepo.decrementAttempt(record)
		throw new UserAuthenticationFailedError({
			reason: 'Invalid credentials',
			attemptsRemaining: newRecord.attemptsRemaining,
		})
	} else {
		record.authenticationMechanism = authenticationMechanism.USERNAME_PASSWORD
	}

	record.authenticatedOn = now()

	return userAuthenticationSessionRepo.update(record)
}
