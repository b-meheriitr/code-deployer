import {Router} from 'express'
import * as buildDeploymentHistoryService from '../services/build-deployment-history.service'

const router = Router()

router.get('/build', async (req, res) => {
	const data = await buildDeploymentHistoryService.getBuildHistory()

	res.status(200)
		.json(data)
})
router.get('/deployment', async (req, res) => {
	const data = await buildDeploymentHistoryService.getDeploymentHistory()

	res.status(200)
		.json(data)
})

export default router
