import {Router} from 'express'
import {UserAlreadyExistsError, UserNotfoundError} from '../errors/errors'
import * as userService from '../services/user.service'
import {wrapErrHandler} from '../utils/controllerUtils'

const router = Router()

router.post(
	'/create',
	wrapErrHandler(
		async (req, res) => {
			try {
				await userService.create(req.body)
				res.sendStatus(201)
			} catch (e) {
				if (e instanceof UserAlreadyExistsError) {
					res.status(422).json({message: e.message})
				}
				throw e
			}
		},
	),
)

router.put(
	'/change-password',
	wrapErrHandler(
		async (req, res) => {
			try {
				await userService.changePassword(req.body)
				res.sendStatus(200)
			} catch (e) {
				if (e instanceof UserNotfoundError) {
					res.status(422).json({message: e.message})
				}
				throw e
			}
		},
	),
)

export default router
