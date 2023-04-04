import fs from 'fs'
import path from 'path'
import {APP_CONFIG} from '../config'
import {AppIdNotFoundError, SourceBackupDirNotExistErr} from '../errors/errors'
import {backupFiles, deleteFolder, rollBackDeleted, unzipBufferStream} from '../utils/files.utils'
import {dateString} from '../utils/utils'

const getAppDataBackupPaths = async appId => {
	const apps = JSON.parse(await fs.promises.readFile('./db/apps.json', 'utf-8'))

	const app = apps[appId]

	if (!app) {
		throw new AppIdNotFoundError(appId)
	}

	return {
		backupPath: path.join(APP_CONFIG.APPS_BACKUPS_PATH, app.appName),
		dataPath: path.join(APP_CONFIG.APPS_EXECUTABLE_PATH, app.appName),
	}
}

const getBackupFileName = backupOutFilePath => {
	const backupName = `${dateString().replace(/:/g, '-')
		.replace(/ /g, '_')}.zip`
	return path.join(backupOutFilePath, backupName)
}

export default async function (appId, ignoreDeletePattern, incomingZip) {
	const {dataPath, backupPath} = await getAppDataBackupPaths(appId)
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

	try {
		// this can delete dataPath if it already does not exist
		await deleteFolder(dataPath, ignoreDeletePattern)
		await unzipBufferStream(incomingZip.buffer, dataPath)
	} catch (e) {
		await rollBackDeleted(backupZipFilePath, dataPath)
		throw e
	}
}
