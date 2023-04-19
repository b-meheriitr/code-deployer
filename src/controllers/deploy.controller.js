import {AppIdNotPresentInHeadersError, AppNotFoundError} from '../errors/errors'
import {RollbackStatusesWithBaseReason} from '../models/RollbackStatus'
import deployService from '../services/deploy.service'

function getAppId(req) {
	const appId = req.headers['app-name']
	if (!appId) {
		throw new AppIdNotPresentInHeadersError()
	}
	return appId
}

export default async (req, res) => {
	try {
		await deployService(
			getAppId(req),
			JSON.parse(req.body.ignoreDelete || '[]'),
			req.file,
		)
		return res.status(201).send()
	} catch (err) {
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
