import {AppNotFoundError, AppValidationError} from '../errors/errors'
import {appRepo} from '../repo'
import {beforeUpdate} from '../utils/repo.utils'
import {throwIfNull, toLocalDateString} from '../utils/utils'

export async function getByAppId(appId) {
	return throwIfNull(
		await appRepo.findByAppId(appId),
		() => new AppNotFoundError(appId),
	).dataValues
}

export function upsert(data) {
	return appRepo.findOne({id: data.id})
		.then(existingRecord => {
			if (existingRecord) {
				beforeUpdate(data)
				return appRepo.update(data, {where: {id: data.id}})
					.then(() => data)
			}
			return appRepo.insert(data)
		})
		.catch(err => {
			if (/SequelizeUniqueConstraintError: Validation error/.test(err.toString())) {
				throw new AppValidationError(`App with nginxRoutePath: ${data.nginxRoutePath} already exists`)
			}
			throw err
		})
}

export function appExists(appId) {
	return appRepo.exists(appId)
}

export function getAll() {
	return appRepo.findAll()
		.then(apps => {
			apps.sort(({dataValues: a}, {dataValues: b}) => a.createdOn - b.createdOn)
			return apps
		})
		.then(apps => {
			apps.forEach(({dataValues: ap}) => {
				ap.createdOn = toLocalDateString(ap.createdOn)
				ap.updatedOn = toLocalDateString(ap.updatedOn)
			})

			return apps
		})
}
