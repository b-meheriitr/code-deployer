import {SERVER_CONFIG} from '../config'
import {appPortRepo} from '../repo'
import {beforeUpdate} from '../utils/repo.utils'

const {HOST_NAME} = SERVER_CONFIG

export function upsert(port, appId) {
	const data = {port, appId, hostName: HOST_NAME}

	return appPortRepo.findOne({appId, hostName: HOST_NAME})
		.then(existingRecord => {
			if (existingRecord) {
				beforeUpdate(data)
				return appPortRepo.update(data, {where: {appId, hostName: HOST_NAME}})
			}
			return appPortRepo.insert(data)
		})
		.catch(err => {
			if (/SequelizeUniqueConstraintError: Validation error/.test(err.toString())) {
				return false
			}
			throw err
		})
}

export const getAllRecords = () => appPortRepo.findAll()

export const getAnAvailablePortGuess = () => appPortRepo.getPortMax(HOST_NAME).then(max => max || undefined)

export class AppPortService {
	#prev

	#upsertSuccessful

	constructor(appId) {
		this.appId = appId
	}

	upsert = async port => {
		this.#prev = await appPortRepo.findOne({appId: this.appId, hostName: HOST_NAME})
		return upsert(port, this.appId)
			.then(data => {
				this.#upsertSuccessful = !!data
				return data
			})
	}

	rollBack = async () => {
		if (this.#upsertSuccessful === true) {
			if (this.#prev === null) {
				await appPortRepo.delete(HOST_NAME, this.appId, {force: true})
			} else {
				await upsert(this.#prev.port, this.appId)
			}
		}

		return Promise.resolve(this.#upsertSuccessful !== undefined)
	}
}
