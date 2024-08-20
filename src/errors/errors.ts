export class AppNotFoundError extends Error {
	constructor(appId: string) {
		super(`App id: ${appId} not found`)
	}
}

export class AppValidationError extends Error {
}

export class AppIdNotPresentInHeadersError extends Error {
	constructor() {
		super('App Id not provided in request headers')
	}
}

export class SourceBackupDirNotExistErr extends Error {
	constructor(sourceDir: string) {
		super(`Source backup dir ${sourceDir} does not exist. Can't backup`)
	}
}

export class CorruptedIncomingZipError extends Error {
	constructor() {
		super('Uploaded zip is corrupted/invalid')
	}
}

export class UserAuthenticationFailedError extends Error {
	public attemptsRemaining: number

	constructor({reason, attemptsRemaining}: UserAuthenticationFailedErrorProps) {
		super(`Authentication failed due to ${reason}`)
		this.attemptsRemaining = attemptsRemaining
	}
}

export interface UserAuthenticationFailedErrorProps {
	reason: string,
	attemptsRemaining: number
}

export class AuthenticationSessionNotfoundError extends Error {
	constructor(sessionId: string) {
		super(`Authentication session by id ${sessionId} not found`)
	}
}

export class UserNotfoundError extends Error {
	static BY = {
		USER_NAME: 'userName',
		MOBILE_NO: 'mobileNo',
		EMAIL: 'email',
	}

	constructor(by: string, value: any) {
		super(`User not found by ${by}:${value}`)
	}
}

export class UserAlreadyExistsError extends Error {
	constructor(by: string, value: any) {
		super(`User already exists by ${by}: ${value}`)
	}
}
