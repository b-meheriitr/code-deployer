import {AppIdNotFoundError, AppIdNotPresentInHeadersError} from '../errors/errors'
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
				.json({
					message: `${err.message}. Register your app. If already done, edit the app.json file to include your app info`,
				})
		}
		if (err instanceof AppIdNotPresentInHeadersError) {
			return res.status(422).json({message: err.message})
		}
		throw err
	}
}
