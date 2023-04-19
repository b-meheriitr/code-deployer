import {Router} from 'express'
import fs from 'fs'
import path from 'path'
import {APP_CONFIG} from '../config'
import {wrapErrHandler} from '../utils/controllerUtils'
import {createDirectoryRecursiveSync} from '../utils/files.utils'
import deployRoute from './deploy.route'

const router = Router()

router.use('/deploy', deployRoute)

router.post('/app/register', wrapErrHandler(async (req, res) => {
	const {name: appName, info: appInfo} = req.body

	const appPath = path.join(APP_CONFIG.APPS_EXECUTABLE_PATH, appName)

	if (fs.existsSync(appPath)) {
		res.status(422).json({message: `App with name: ${appName} already exists`})
	} else {
		createDirectoryRecursiveSync(appPath)

		const modifiedAppInfo = {
			...appInfo,
			name: appName,
			cwd: path.join('deployment', appInfo.cwd || ''),
		}

		await fs.promises.writeFile(
			path.join(appPath, 'pm2.json'),
			JSON.stringify([modifiedAppInfo], null, 2),
		)

		res.status(201).json({message: 'created', appName})
	}
}))

export default router
