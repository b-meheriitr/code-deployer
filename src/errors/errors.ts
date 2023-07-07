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
