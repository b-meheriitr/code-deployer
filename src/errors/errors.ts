export class AppIdNotFoundError extends Error {
	constructor(appId: string) {
		super(`App Id: ${appId} not found`)
	}
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
