import {AppIdNotFoundError, AppIdNotPresentInHeadersError} from '../errors/errors'
import {Pm2ProcessErrorOnRestart} from '../errors/pm2.errors'
import deployService from '../services/deploy.service'

function getAppId(req) {
	const appId = req.headers['app-id']
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
		if (err instanceof AppIdNotFoundError) {
			return res.status(422)
				.json({message: `${err.message}. Register your app.`})
		}
		if (err instanceof AppIdNotPresentInHeadersError) {
			return res.status(422).json({message: err.message})
		}
		if (err instanceof Pm2ProcessErrorOnRestart) {
			return res.status(449).json({
				message: 'Error in startup',
				err,
			})
		}
		throw err
	}
}
