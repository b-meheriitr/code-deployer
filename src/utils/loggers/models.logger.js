export class LoggerConfig {
	constructor(config) {
		Object.assign(this, config)
	}
}

export const lc = config => new LoggerConfig(config)
