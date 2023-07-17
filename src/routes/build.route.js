import {Router} from 'express'
import buildController, {downloadArtifactZip} from '../controllers/build.controller'
import {AppIdNotPresentInHeadersError, AppNotFoundError, CorruptedIncomingZipError} from '../errors/errors'
import {formDataFileToBufferMw, verifyIncomingZip} from '../middlewares/files.mw'
import {wrapErrHandler} from '../utils/controllerUtils'
import {sendJsonCheckingHeadersSent} from '../utils/utils'

const router = Router()

router.post(
	'/',
	wrapErrHandler(formDataFileToBufferMw()),
	wrapErrHandler(verifyIncomingZip),
	(req, res, next) => {
		req.body = JSON.parse(req.body.body)
		next()
	},
	wrapErrHandler(buildController),
	(err, req, res, next) => {
		if (err instanceof CorruptedIncomingZipError) {
			return sendJsonCheckingHeadersSent({
				res,
				status: 400,
				json: {message: err.message},
			})
		}
		if (err instanceof AppNotFoundError) {
			return sendJsonCheckingHeadersSent({
				res,
				status: 422,
				json: {message: `${err.message}. Register your app.`},
			})
		}
		if (err instanceof AppIdNotPresentInHeadersError) {
			return sendJsonCheckingHeadersSent({
				res,
				status: 422,
				json: {message: err.message},
			})
		}
		return next(err)
	},
)

router.get('/download-artifact-zip/:artifactZipNameOrId', wrapErrHandler(downloadArtifactZip))

export default router
