import pm2 from 'pm2'
import {Pm2ProcessErrorOnRestart, Pm2ProcessNotFoundError, Pm2ProcessNotFoundErrorBy} from '../errors/pm2.errors'
import logger from '../utils/loggers'

const promisifyCallBack = (resolve, reject) => {
	return (err, data) => (err ? reject(new Error(err)) : resolve(data))
}

function pm2ConnectionWrapper(action) {
	const connect = () => new Promise((resolve, reject) => {
		pm2.connect(promisifyCallBack(resolve, reject))
	})

	const disconnect = () => pm2.disconnect()

	return connect()
		.then(() => action())
		.finally(() => disconnect())
}

function listProcesses() {
	return new Promise((resolve, reject) => {
		pm2.list(promisifyCallBack(resolve, reject))
	})
}

export async function findProcess(processName) {
	const process = (await listProcesses()).find(p => p.name === processName)

	if (!process) {
		throw new Pm2ProcessNotFoundError(Pm2ProcessNotFoundErrorBy.NAME, processName)
	}

	return process
}

export function start(pm2Config) {
	return new Promise((resolve, reject) => {
		pm2.start(pm2Config, promisifyCallBack(resolve, reject))
	})
}

export function reStart(processName) {
	return new Promise((resolve, reject) => {
		pm2.restart(processName, promisifyCallBack(resolve, reject))
	})
}

function listenForProcessToBeUp(processName) {
	return new Promise((resolve, reject) => {
		pm2.launchBus((error, bus) => {
			if (error) {
				logger.error(error)
				reject(new Error(error))
			}

			bus.on('process:exception', data => {
				if (data.process.name === processName) {
					reject(new Pm2ProcessErrorOnRestart(data))
				}
			})

			setTimeout(() => {
				bus.off('process:exception')
				resolve()
			}, 3000) // todo: this needs to be configurable
		})
	})
}

export function deleteProcess(processName) {
	return pm2ConnectionWrapper(() => {
		return new Promise((resolve, reject) => {
			pm2.delete(processName, {delete: true}, promisifyCallBack(resolve, reject))
		})
	})
}

export class Pm2Service {
	#newProcess

	#appliedRestartSuccess

	constructor(config) {
		this.processName = config.name
		this.config = config
		this.#newProcess = undefined
		this.isNewProcess = async () => {
			if (this.#newProcess === undefined) {
				this.#newProcess = !(await this.#processExists())
			}
			return this.#newProcess
		}
	}

	async pm2Restart() {
		try {
			await this.#restartProcess(true)
				.then(() => (this.#appliedRestartSuccess = true))
		} catch (e) {
			this.#appliedRestartSuccess = false

			if (e instanceof Pm2ProcessErrorOnRestart) {
				logger.info('Error in startup, rolling back to previous version', e.message)
			}

			throw e
		}
	}

	async pm2Rollback() {
		if (this.#appliedRestartSuccess !== undefined) {
			if (await this.isNewProcess() /** && await this.#processExists() /** why this hangs when called here? * */) {
				await deleteProcess(this.processName)
					.catch(err => {
						if (!(/process or namespace not found/.test(err.message))) {
							throw err
						}
					})
				return Promise.resolve(1)
			}
			await this.#restartProcess(this.processName)
			return Promise.resolve(1)
		}

		return Promise.resolve(0)
	}

	#restartProcess(startIfNotExists) {
		return pm2ConnectionWrapper(async () => {
			if (startIfNotExists && await this.isNewProcess()) {
				await start(this.config)
			} else {
				await reStart(this.processName)
			}

			return listenForProcessToBeUp(this.processName)
		})
	}

	#processExists() {
		return findProcess(this.processName)
			.then(() => true)
			.catch(e => {
				if (e instanceof Pm2ProcessNotFoundError) return false
				throw e
			})
	}
}
