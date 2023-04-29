export class Pm2ProcessNotFoundError extends Error {
	constructor(by: Pm2ProcessNotFoundErrorBy, value: any) {
		super(`pm2 process by ${by}: ${value} not found`)
	}
}

export class Pm2ProcessErrorOnRestart extends Error {
	private pm2ErrData: any

	constructor(pm2ErrData: any) {
		super(pm2ErrData.message)
		this.pm2ErrData = pm2ErrData
	}
}

export enum Pm2ProcessNotFoundErrorBy {
	NAME,
}
