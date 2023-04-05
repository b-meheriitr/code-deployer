import fs from 'fs'
import path from 'path'
import {APP_CONFIG} from '../config'
import {AppIdNotFoundError, SourceBackupDirNotExistErr} from '../errors/errors'
import {Pm2ProcessErrorOnRestart} from '../errors/pm2.errors'
import {backupFiles, deleteFolder, rollBackDeleted, unzipBufferStream} from '../utils/files.utils'
import logger from '../utils/loggers'
import {dateString} from '../utils/utils'
import {Pm2Service} from './pm2.service'

const getAppInfo = async appId => {
	const appPm2Path = path.join(APP_CONFIG.APPS_EXECUTABLE_PATH, appId, 'pm2.json')
	let app = fs.existsSync(appPm2Path) && JSON.parse(await fs.promises.readFile(appPm2Path, 'utf-8') || '[]')[0]

	if (!app) {
		throw new AppIdNotFoundError(appId)
	}

	app = {...app, name: appId, cwd: path.join(APP_CONFIG.APPS_EXECUTABLE_PATH, appId)}

	return {
		backupPath: path.join(APP_CONFIG.APPS_BACKUPS_PATH, app.name),
		dataPath: path.join(APP_CONFIG.APPS_EXECUTABLE_PATH, app.name),
		pm2: app,
	}
}

const getBackupFileName = backupOutFilePath => {
	const backupName = `${dateString().replace(/:/g, '-')
		.replace(/ /g, '_')}.zip`
	return path.join(backupOutFilePath, backupName)
}

export default async function (appId, ignoreDeletePattern, incomingZip) {
	const {dataPath, backupPath, pm2} = await getAppInfo(appId)
	const backupZipFilePath = getBackupFileName(backupPath)
	// archive is corrupted when used '!' glob pattern
	const ignoreBackup = ignoreDeletePattern.filter(p => !p.startsWith('!'))

	try {
		await backupFiles(
			dataPath,
			backupZipFilePath,
			ignoreBackup,
		)
	} catch (err) {
		if (!(err instanceof SourceBackupDirNotExistErr)) throw err
	}

	const pm2Service = new Pm2Service(pm2)
	try {
		// this can delete dataPath if it already does not exist
		await deleteFolder(dataPath, ignoreDeletePattern)
		await unzipBufferStream(incomingZip.buffer, dataPath)
		await pm2Service.pm2Restart(pm2)
	} catch (e) {
		await rollBackDeleted(backupZipFilePath, dataPath)
		if (e instanceof Pm2ProcessErrorOnRestart) {
			logger.info('Error in startup, rolling back to previous version', e.message)
			await pm2Service.pm2Rollback(pm2)
		}
		throw e
	}
}
