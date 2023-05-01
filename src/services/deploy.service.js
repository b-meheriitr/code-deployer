import fs from 'fs'
import path from 'path'
import {APP_CONFIG} from '../config'
import {AppNotFoundError} from '../errors/errors'
import {RollbackStatusesWithBaseReason} from '../models/RollbackStatus'
import {FsActionsHelper} from '../utils/files.utils'
import logger from '../utils/loggers'
import {lc} from '../utils/loggers/models.logger'
import {dateString} from '../utils/utils'
import NginxUtilService from './nginx.service'
import {Pm2Service} from './pm2.service'

const getAppInfo = async appId => {
	const appPm2Path = path.join(APP_CONFIG.APPS_EXECUTABLE_PATH, appId, 'pm2.json')
	let app = fs.existsSync(appPm2Path) && JSON.parse(await fs.promises.readFile(appPm2Path, 'utf-8'))[0]

	if (!app) {
		throw new AppNotFoundError(appId)
	}

	app = {
		...app,
		cwd: path.join(APP_CONFIG.APPS_EXECUTABLE_PATH, appId, app.cwd),
	}

	return {
		backupPath: path.join(APP_CONFIG.APPS_BACKUPS_PATH, app.name),
		dataPath: path.join(APP_CONFIG.APPS_EXECUTABLE_PATH, app.name, 'deployment'),
		appConfig: app,
	}
}

const getBackupFileName = backupOutFilePath => {
	const backupName = `${dateString().replace(/:/g, '-')
		.replace(/ /g, '_')}.zip`
	return path.join(backupOutFilePath, backupName)
}

export default async function (appId, ignoreDeletePattern, incomingZip, {req}) {
	const {dataPath, backupPath, appConfig} = await getAppInfo(appId)
	const backupZipFilePath = getBackupFileName(backupPath)

	const pm2Service = new Pm2Service(appConfig)
	const fileActionsHelper = new FsActionsHelper(dataPath, backupZipFilePath, ignoreDeletePattern)
	let ports
	try {
		await fileActionsHelper.backupSource()
		await fileActionsHelper.deleteSourceDir()
		await fileActionsHelper.unzipBufferStream(incomingZip.buffer)
		ports = await pm2Service.pm2Restart(appConfig)
	} catch (e) {
		logger.error(e, lc({req}))

		const rollbackStatuses = []

		await fileActionsHelper.rollBackDeleted()
			.then(
				status => rollbackStatuses.push({for: 'rollBackDeleted', status: !!status}),
				err => {
					rollbackStatuses.push({for: 'rollBackDeleted', status: 'error', reason: err})
					throw err
				},
			)
			.then(() => pm2Service.pm2Rollback(appConfig))
			.then(
				status => rollbackStatuses.push({for: 'pm2Rollback', status: !!status}),
				err => {
					rollbackStatuses.push({for: 'pm2Rollback', status: 'error', reason: err})
					throw err
				},
			)
			.catch(f => f)

		/*
			todo: dont send host/server related infos
			ex: for script not found error, its sending the absolute app deployment path
		 */
		throw new RollbackStatusesWithBaseReason(e.toString(), rollbackStatuses)
	}

	if (Array.isArray(ports)) {
		const nginxService = new NginxUtilService({name: appId})
		nginxService.setNewPort(ports[0])

		try {
			return {
				route: await nginxService.createRoute(),
				ports,
			}
		} catch (e) {
			logger.error(e, lc({req}))

			const rollbackStatuses = []

			await nginxService.rollBack()
				.then(
					status => rollbackStatuses.push({for: 'nginxRollback', status: !!status}),
					err => {
						rollbackStatuses.push({for: 'nginxRollback', status: 'error', reason: err})
						throw err
					},
				)
				.catch(f => f)

			return {
				message: 'Error in nginx routing',
				baseReason: e.toString(),
				rollbackStatuses,
				ports,
			}
		}
	} else {
		return ports
	}
}
