import {Router} from 'express'
import deployController from '../controllers/deploy.controller'
import {CorruptedIncomingZipError} from '../errors/errors'
import {formDataFileToBufferMw, verifyIncomingZip} from '../middlewares/files.mw'
import {logDeploymentHistoryRecord} from '../services/build-deployment-history.service'
import {wrapErrHandler} from '../utils/controllerUtils'

const router = Router()

router.post(
	'/',
	wrapErrHandler(formDataFileToBufferMw()),
	wrapErrHandler(verifyIncomingZip),
	wrapErrHandler(async (req, res, next) => {
		await logDeploymentHistoryRecord(
			() => deployController(req, res, next),
			req,
		)
	}),
	(err, req, res, next) => {
		if (err instanceof CorruptedIncomingZipError) {
			return res.status(400).json({message: err.message})
		}
		return next(err)
	},
)

export default router
