import fs from 'fs'
import path from 'path'
import {APP_CONFIG} from '../config'
import {AppNotFoundError} from '../errors/errors'
import {RollbackStatusesWithBaseReason} from '../models/RollbackStatus'
import {FsActionsHelper} from '../utils/files.utils'
import {dateString} from '../utils/utils'
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
		pm2: app,
	}
}

const getBackupFileName = backupOutFilePath => {
	const backupName = `${dateString().replace(/:/g, '-')
		.replace(/ /g, '_')}.zip`
	return path.join(backupOutFilePath, backupName)
}

export default async function (appId, ignoreDeletePattern, incomingZip, {req}) {
	const {dataPath, backupPath, pm2} = await getAppInfo(appId)
	const backupZipFilePath = getBackupFileName(backupPath)

	const pm2Service = new Pm2Service(pm2)
	const fileActionsHelper = new FsActionsHelper(dataPath, backupZipFilePath, ignoreDeletePattern)

	try {
		await fileActionsHelper.backupSource()
		await fileActionsHelper.deleteSourceDir()
		await fileActionsHelper.unzipBufferStream(incomingZip.buffer)
		return (await pm2Service.pm2Restart(pm2))
	} catch (e) {
		const rollbackStatuses = []

		await fileActionsHelper.rollBackDeleted()
			.then(
				status => rollbackStatuses.push({for: 'rollBackDeleted', status: !!status}),
				err => {
					rollbackStatuses.push({for: 'rollBackDeleted', status: 'error', reason: err})
					throw err
				},
			)
			.then(() => pm2Service.pm2Rollback(pm2))
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
}
