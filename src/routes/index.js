import {Router} from 'express'
import deployRoute from './deploy.route'

const router = Router()

router.use('/deploy', deployRoute)

export default router
