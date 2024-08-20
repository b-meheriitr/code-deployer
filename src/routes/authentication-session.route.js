import {Router} from 'express'
import {UserAuthenticationFailedError} from '../errors/errors'
import {authenticate} from '../services/deploymentAuthentication.service'
import {wrapErrHandler} from '../utils/controllerUtils'

const router = Router()

router.post(
	'/',
	wrapErrHandler(
		async (req, res) => {
			try {
				await authenticate(req.body)
				res.status(200).json({message: 'authentication successful'})
			} catch (e) {
				if (e instanceof UserAuthenticationFailedError) {
					res.status(401).json({message: e.message, attemptsRemaining: e.attemptsRemaining})
				}

				throw e
			}
		},
	),
)

export default router
