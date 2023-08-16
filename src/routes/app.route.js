import {Router} from 'express'
import fs from 'fs'
import path from 'path'
import {APP_CONFIG} from '../config'
import {AppValidationError} from '../errors/errors'
import * as appPortService from '../services/app-port.service'
import * as appService from '../services/app.service'
import {appExists} from '../services/app.service'
import {wrapErrHandler} from '../utils/controllerUtils'
import {createDirectoryRecursiveSync} from '../utils/files.utils'
import {getPackagePath} from '../utils/utils'

const router = Router()

function validateAppRegisterReqBody(body) {
	// todo
}

router.get(
	'/all-app-ports',
	wrapErrHandler(async (req, res) => {
		res.status(200).json(await appPortService.getAllRecords())
	}),
)

function getNginxPath(otherInfo, appName) {
	if (otherInfo.nginxRoutePath === '/') {
		return ''
	}

	return otherInfo.nginxRoutePath
		|| (
			otherInfo.package
				? `${otherInfo.package.replace(/\./g, '-')}-${appName}`
				: appName
		)
}

router.post(
	'/register',
	wrapErrHandler(async (req, res) => {
		validateAppRegisterReqBody(req.body)

		const {name: appName, info: appInfo, ..._otherInfo} = req.body

		const packagePath = getPackagePath(_otherInfo.package)

		const appPath = path.join(APP_CONFIG.APPS_EXECUTABLE_PATH, packagePath, appName)

		const appId = `${_otherInfo.package ? `${_otherInfo.package}.` : ''}${appName}`

		if (fs.existsSync(path.join(appPath, 'pm2.json')) && await appExists(appId)) {
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

			const app = await appService.upsert({
				id: appId,
				appName,
				package: _otherInfo.package || '',
				appAbsolutePath: path.resolve(appPath),
				backupPath: path.resolve(appBackupPath),
				dataPath: path.resolve(appDataPath),
				nginxRoutePath: getNginxPath(_otherInfo, appName),
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

router.get(
	'/all',
	wrapErrHandler(
		async (req, res) => {
			res.status(200).json(await appService.getAll())
		},
	),
)

export default router
