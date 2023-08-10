import {Router} from 'express'
import {getNextAvailablePort} from '../utils/os.utils'
import appRoute from './app.route'
import buildRoute from './build.route'
import deployRoute from './deploy.route'

const router = Router()

router.use('/deploy', deployRoute)
router.use('/build', buildRoute)
router.use('/app', appRoute)

router.get('/next-available-port/:port', async (req, res) => {
	res.status(200).json(await getNextAvailablePort(+req.params.port))
})

export default router
