import {Router} from 'express'
import deployController from '../controllers/deploy.controller'
import {formDataFileToBufferMw} from '../middlewares/files.mw'
import {wrapErrHandler} from '../utils/controllerUtils'

const router = Router()

router.post(
	'/',
	wrapErrHandler(formDataFileToBufferMw()),
	wrapErrHandler(deployController),
)

export default router
