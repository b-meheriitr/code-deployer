import _ from 'lodash'
import path from 'path'
import {APP_CONFIG} from '../config'
import logger from '../utils/loggers'
import {getNextAvailablePort} from '../utils/os.utils'
import {AppPortService} from './app-port.service'
import {isServerLess, writeNewEnvConfigToPm2} from './pm2.service'

const {ASSIGNABLE_PORTS_RANGE} = APP_CONFIG

export default class EnvConfigSetterService {
	#backupConfig

	#appId

	#wroteNewConfigToPm2

	#registeredNewPort

	#appPortService

	#executeSuccessFul

	constructor(appConfig, appId) {
		this.#backupConfig = _.cloneDeep(appConfig)
		this.#appId = appId || appConfig.name
		this.appConfig = appConfig
		this.#appPortService = new AppPortService(this.#appId)
	}

	execute = async action => {
		try {
			const availablePort = isServerLess(this.appConfig)
				? undefined
				: await this.#registerAnAvailablePort()
					.then(
						port => {
							this.#registeredNewPort = true
							return port
						},
						err => {
							this.#registeredNewPort = false
							throw err
						},
					)

			const contentRoot = isServerLess(this.appConfig)
				? path.resolve(this.appConfig.cwd)
				: undefined

			this.#setEnvVariables({availablePort, contentRoot})

			const actionResult = await action()

			// todo this should be retried
			await writeNewEnvConfigToPm2(this.#appId, this.appConfig.env)
				.then(
					() => (this.#wroteNewConfigToPm2 = true),
					e => {
						logger.error(e)
						this.#wroteNewConfigToPm2 = false
					},
				)

			this.#executeSuccessFul = true

			return {
				actionResult,
				serverPort: availablePort || contentRoot,
			}
		} catch (e) {
			this.#executeSuccessFul = false
			throw e
		}
	}

	rollBack = async () => {
		await this.#appPortService.rollBack()

		if (this.#wroteNewConfigToPm2 !== undefined) {
			await writeNewEnvConfigToPm2(this.#appId, this.#backupConfig.env)
		}

		return Promise.resolve(this.#executeSuccessFul !== undefined)
	}

	#registerAnAvailablePort = async (availablePortGuess = ASSIGNABLE_PORTS_RANGE[0]) => {
		let [portRMin] = ASSIGNABLE_PORTS_RANGE
		const [, portRMax] = ASSIGNABLE_PORTS_RANGE

		const maxPortToChecksCount = portRMax - portRMin + 1
		let portsCheckedCount = 0
		let port = availablePortGuess
		do {
			if (port < portRMin || portRMax < port) {
				// eslint-disable-next-line no-plusplus
				port = ++portRMin
			}

			// eslint-disable-next-line no-await-in-loop
			const nextAvailablePort = await getNextAvailablePort(port)
			const isPortInRange = portRMin <= nextAvailablePort && nextAvailablePort <= portRMax

			if (isPortInRange) {
				// eslint-disable-next-line no-await-in-loop
				const portAvailableInDb = await this.#appPortService.upsert(nextAvailablePort, this.#appId)
				if (portAvailableInDb) {
					return nextAvailablePort
				}
			}

			port = nextAvailablePort + 1
			portsCheckedCount += 1
		} while (port !== portRMin && portsCheckedCount < maxPortToChecksCount)

		throw new Error(`No port is available in range [${portRMin}, ${portRMax}]`)
	}

	#setEnvVariables = config => {
		let newVariables

		// eslint-disable-next-line no-underscore-dangle
		if (this.appConfig._info?.type === 'reactjs') {
			newVariables = {
				CONTENT_ROOT: config.contentRoot,
			}
		} else {
			newVariables = {
				PORT: config.availablePort,
				SERVER_PORT: config.availablePort,
				NODE_CONFIG: JSON.stringify({server: {port: config.availablePort}}),
			}
		}

		this.appConfig.env = {
			...this.appConfig.env,
			...newVariables,
		}
	}
}
