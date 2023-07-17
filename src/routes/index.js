import {Router} from 'express'
import fs from 'fs'
import path from 'path'
import {APP_CONFIG} from '../config'
import {AppValidationError} from '../errors/errors'
import * as appPortService from '../services/app-port.service'
import * as appService from '../services/app.service'
import {wrapErrHandler} from '../utils/controllerUtils'
import {createDirectoryRecursiveSync} from '../utils/files.utils'
import {getNextAvailablePort} from '../utils/os.utils'
import {getPackagePath} from '../utils/utils'
import buildRoute from './build.route'
import deployRoute from './deploy.route'

function validateAppRegisterReqBody(body) {
	// todo
}

const router = Router()

router.use('/deploy', deployRoute)
router.use('/build', buildRoute)

router.get('/next-available-port/:port', async (req, res) => {
	res.status(200).json(await getNextAvailablePort(+req.params.port))
})

router.get('/all-app-ports', async (req, res) => {
	res.status(200).json(await appPortService.getAllRecords())
})

router.post(
	'/app/register',
	wrapErrHandler(async (req, res) => {
		validateAppRegisterReqBody(req.body)

		const {name: appName, info: appInfo, ..._otherInfo} = req.body

		const packagePath = getPackagePath(_otherInfo.package)

		const appPath = path.join(APP_CONFIG.APPS_EXECUTABLE_PATH, packagePath, appName)

		if (fs.existsSync(path.join(appPath, 'pm2.json'))) {
			res.status(422).json({
				message: `App with name: ${appName} ${_otherInfo.package ? `and package: ${_otherInfo.package} ` : ''}already exists`,
			})
		} else {
			const appBackupPath = path.join(APP_CONFIG.APPS_BACKUPS_PATH, packagePath, appName)
			const appDataPath = path.join(APP_CONFIG.APPS_DATA_PATH, packagePath, appName)

			createDirectoryRecursiveSync(path.join(appPath, 'deployment'))
			createDirectoryRecursiveSync(appDataPath)

			const modifiedAppInfo = {
				...appInfo,
				name: appName,
				cwd: path.join('deployment', appInfo.cwd || ''),
				_info: _otherInfo,
			}

			const [app] = await appService.upsert({
				id: `${_otherInfo.package ? `${_otherInfo.package}.` : ''}${appName}`,
				appName,
				package: _otherInfo.package || '',
				appAbsolutePath: path.resolve(appPath),
				backupPath: path.resolve(appBackupPath),
				dataPath: path.resolve(appDataPath),
				nginxRoutePath: _otherInfo.nginxRoutePath
					|| (
						_otherInfo.package
							? `${_otherInfo.package.replace(/\./g, '-')}-${appName}`
							: appName
					),
			})

			await fs.promises.writeFile(
				path.join(appPath, 'pm2.json'),
				JSON.stringify([modifiedAppInfo], null, 2),
			)

			res.status(201).json({message: 'created', app})
		}
	}),
	(err, req, res, next) => {
		if (err instanceof AppValidationError) {
			res.status(422).json({message: err.message})
		} else {
			next(err)
		}
	},
)

export default router
