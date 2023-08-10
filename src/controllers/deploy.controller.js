import {AppIdNotPresentInHeadersError, AppNotFoundError} from '../errors/errors'
import {RollbackStatusesWithBaseReason} from '../models/RollbackStatus'
import deployService from '../services/deploy.service'
import {getAppId} from '../utils/utils'

export default async (req, res) => {
	try {
		const data = await deployService(
			getAppId(req),
			JSON.parse(req.body.ignoreDelete || '[]'),
			req.file,
			{req},
		)
		return res.status(201).json(data)
	} catch (err) {
		req.error = err

		if (err instanceof AppNotFoundError) {
			return res.status(422)
				.json({message: `${err.message}. Register your app.`})
		}
		if (err instanceof AppIdNotPresentInHeadersError) {
			return res.status(422).json({message: err.message})
		}
		if (err instanceof RollbackStatusesWithBaseReason) {
			return res.status(449).json({
				message: 'Error',
				info: err,
			})
		}
		throw err
	}
}
