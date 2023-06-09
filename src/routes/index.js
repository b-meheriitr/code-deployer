import {Router} from 'express'
import fs from 'fs'
import path from 'path'
import {APP_CONFIG} from '../config'
import * as appPortService from '../services/app-port.service'
import {wrapErrHandler} from '../utils/controllerUtils'
import {createDirectoryRecursiveSync} from '../utils/files.utils'
import {getNextAvailablePort} from '../utils/os.utils'
import deployRoute from './deploy.route'

const router = Router()

router.use('/deploy', deployRoute)

router.get('/next-available-port/:port', async (req, res) => {
	res.status(200).json(await getNextAvailablePort(+req.params.port))
})

router.get('/all-app-ports', async (req, res) => {
	res.status(200).json(await appPortService.getAllRecords())
})

router.post('/app/register', wrapErrHandler(async (req, res) => {
	const {name: appName, info: appInfo, ..._otherInfo} = req.body

	const appPath = path.join(APP_CONFIG.APPS_EXECUTABLE_PATH, appName)

	if (fs.existsSync(path.join(appPath, 'pm2.json'))) {
		res.status(422).json({message: `App with name: ${appName} already exists`})
	} else {
		createDirectoryRecursiveSync(path.join(appPath, 'deployment'))

		const modifiedAppInfo = {
			...appInfo,
			name: appName,
			cwd: path.join('deployment', appInfo.cwd || ''),
			_info: _otherInfo,
		}

		await fs.promises.writeFile(
			path.join(appPath, 'pm2.json'),
			JSON.stringify([modifiedAppInfo], null, 2),
		)

		res.status(201).json({message: 'created', appName})
	}
}))

export default router
