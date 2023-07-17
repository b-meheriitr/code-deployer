import {AppNotFoundError, AppValidationError} from '../errors/errors'
import {appRepo} from '../repo'
import {beforeUpdate} from '../utils/repo.utils'
import {throwIfNull} from '../utils/utils'

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
