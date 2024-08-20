import {Router} from 'express'
import {getNextAvailablePort} from '../utils/os.utils'
import appRoute from './app.route'
import authenticateSessionRoute from './authentication-session.route'
import historyRoute from './build-deploy-history.route'
import buildRoute from './build.route'
import deployRoute from './deploy.route'
import userRoute from './user.route'

const router = Router()

router.use(['/v2/deploy', '/deploy'], deployRoute)
router.use('/build', buildRoute)
router.use('/history', historyRoute)
router.use('/app', appRoute)
router.use('/authenticate', authenticateSessionRoute)
router.use('/user', userRoute)

router.get('/next-available-port/:port', async (req, res) => {
	res.status(200).json(await getNextAvailablePort(+req.params.port))
})

export default router
