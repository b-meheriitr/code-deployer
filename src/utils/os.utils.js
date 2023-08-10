/* eslint-disable no-promise-executor-return */
import {exec} from 'child_process'
import detect from 'detect-port'
import os from 'os'
import logger from './loggers'

export const runCommand = (command, cwd) => {
	return new Promise((resolve, reject) => {
		exec(command, {cwd}, (error, stdout, stderr) => {
			if (error) {
				reject(error)
			}

			resolve({stderr, stdout})
		})
	})
}

class PortsFinder {
	constructor(pid) {
		this.pid = pid
	}

	async getPorts() {
		const {stdout: commandResult = ''} = await runCommand(this.getCommand())
			.catch(e => {
				logger.error(e)
				return {}
			})

		const processDetails = this.filterResultByPid(commandResult.split(os.EOL))

		const ports = processDetails.length
		              ? [...new Set(this.extractPortFromProcessDetails(processDetails))]
		              : undefined

		if (ports === undefined) {
			throw new Error(`No associated port for the pid ${this.pid}`)
		}

		return ports.map(p => +p)
	}
}

class UnixPortFinder extends PortsFinder {
	getCommand() {
		return `sudo lsof -iTCP -sTCP:LISTEN -n -P | grep -E '\\s+${this.pid}\\s+'`
	}

	filterResultByPid(commandResults) {
		const rgx = /\s+(\d+)\s+/

		return commandResults.filter(c => {
			const matches = rgx.exec(c)
			return matches && matches[1] === `${this.pid}`
		})
	}

	// eslint-disable-next-line class-methods-use-this
	extractPortFromProcessDetails(processDetail) {
		return processDetail.map(p => /:(\d+)(?!.*:\d+)/.exec(p)[1])
	}
}

class MacPortFinder extends UnixPortFinder {
	getCommand() {
		return /(?:sudo )?(.*)/.exec(super.getCommand())[1]
	}
}

class Win32PortFinder extends PortsFinder {
	getCommand() {
		return `netstat -ano | findstr ${this.pid} | findstr LISTENING`
	}

	filterResultByPid(commandResults) {
		const rgx = /LISTENING\s+(\d+)/

		return commandResults.filter(c => {
			const matches = rgx.exec(c)
			return matches && matches[1] === `${this.pid}`
		})
	}

	// eslint-disable-next-line class-methods-use-this
	extractPortFromProcessDetails(processDetail) {
		return processDetail.map(p => /:(\d+)\s+/.exec(p)[1])
	}
}

export const osPlatform = os.platform()

export const isWindowsOs = () => osPlatform === 'win32'

export function getPortsFromPid(pid) {
	let finder
	if (osPlatform === 'linux') {
		finder = new UnixPortFinder(pid)
	} else if (osPlatform === 'darwin') {
		finder = new MacPortFinder(pid)
	} else if (isWindowsOs()) {
		finder = new Win32PortFinder(pid)
	} else {
		throw new Error(`Unsupported OS : ${osPlatform}`)
	}

	return finder.getPorts()
}

export async function isProcessListeningOnPort(pid) {
	const ports = await getPortsFromPid(pid).catch(() => [])

	logger.debug(`ports for ${pid}`, ports)
	return ports.length ? ports : false
}

export const sleep = timeInMs => new Promise(res => setTimeout(res, timeInMs))

export const getNextAvailablePort = port => detect(port)

export function isPortListening(port) {
	return getNextAvailablePort(port)
		.then(_port => _port !== port)
		.then(listening => {
			logger.info(`${port} ${listening ? '' : 'not'} listening`)
			return listening
		})
}

export function waitForPortToListenThenReconfirmItsStillListening(port, waitTimeToConfirm) {
	const {portListeningNotificationPromise, resolvePortListening} = (() => {
		let res
		const promise = new Promise(rs => res = rs)

		return {resolvePortListening: res, portListeningNotificationPromise: promise}
	})()

	const portsPollerId = setInterval(async () => {
		if (await isPortListening(port)) {
			resolvePortListening('PORT_IS_UP')
		}
	}, 500)

	return [
		portListeningNotificationPromise
			.then(cancelledDueTo => {
				clearInterval(portsPollerId)
				return cancelledDueTo === 'PORT_IS_UP'
				       ? sleep(waitTimeToConfirm).then(() => isPortListening(port))
				       : cancelledDueTo
			}),
		cancelledDueTo => {
			return resolvePortListening(cancelledDueTo)
		},
	]
}

export const isWindowsPath = filePath => /^[A-Z]:\\/i.test(filePath)
