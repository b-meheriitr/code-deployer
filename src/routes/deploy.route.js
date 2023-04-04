import {Router} from 'express'
import deployController from '../controllers/deploy.controller'
import {CorruptedIncomingZipError} from '../errors/errors'
import {formDataFileToBufferMw, verifyIncomingZip} from '../middlewares/files.mw'
import {wrapErrHandler} from '../utils/controllerUtils'

const router = Router()

router.post(
	'/',
	wrapErrHandler(formDataFileToBufferMw()),
	wrapErrHandler(verifyIncomingZip),
	wrapErrHandler(deployController),
	(err, req, res, next) => {
		if (err instanceof CorruptedIncomingZipError) {
			return res.status(400).json({message: err.message})
		}
		return next(err)
	},
)

export default router
