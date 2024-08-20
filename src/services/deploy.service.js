import path from 'path'
import {RollbackStatusesWithBaseReason} from '../models/RollbackStatus'
import {FsActionsHelper, isArchive} from '../utils/files.utils'
import logger from '../utils/loggers'
import {lc} from '../utils/loggers/models.logger'
import {isWindowsOs} from '../utils/os.utils'
import {dateString, parseBoolean} from '../utils/utils'
import * as appService from './app.service'
import EnvConfigSetterService from './envConfigSetter.service'
import NginxUtilService from './nginx.service'
import {getPm2FileConfig, getPm2Service} from './pm2.service'

const getAppInfo = async appId => {
	const appFromRepo = await appService.getByAppId(appId)

	let app = (await getPm2FileConfig(appId))[0]

	app = {
		...app,
		cwd: path.join(appFromRepo.appAbsolutePath, app.cwd),
	}

	return {
		backupPath: appFromRepo.backupPath,
		dataPath: path.join(appFromRepo.appAbsolutePath, 'deployment'),
		appConfig: {...appFromRepo, ...app},
	}
}

const getBackupFileName = backupOutFilePath => {
	const backupName = `${dateString().replace(/:/g, '-')
		.replace(/ /g, '_')}.zip`
	return path.join(backupOutFilePath, backupName)
}

async function setNginxRoute(targetPortOrPath, app, {req}) {
	const nginxService = new NginxUtilService(app)
	const {port} = nginxService.setNewTargetPortOrPath(targetPortOrPath)

	try {
		return {
			route: await nginxService.createRoute(),
			port,
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
			postRollbackInfo: port,
		}
	}
}

export default async function (appId, ignoreDeletePattern, incomingFile, {req}) {
	const {dataPath, backupPath, appConfig} = await getAppInfo(appId)
	const backupZipFilePath = getBackupFileName(backupPath)

	const pm2Service = getPm2Service(appConfig)
	const fileActionsHelper = new FsActionsHelper(dataPath, backupZipFilePath, ignoreDeletePattern)
	const envConfigSetterService = new EnvConfigSetterService(appConfig, appId)
	let availablePort
	try {
		if (isWindowsOs()) {
			await pm2Service.stop()
		}
		await fileActionsHelper.backupSource()
		await fileActionsHelper.deleteSourceDir()
		if (isArchive(incomingFile.originalname)) {
			await fileActionsHelper.unzipBufferStream(incomingFile.buffer)
		} else {
			if (req.body.script) {
				appConfig.script = incomingFile.originalname
			}
			await fileActionsHelper.writeBufferContent(incomingFile.buffer, incomingFile.originalname)
		}
		const {actionResult, serverPort} = await envConfigSetterService.execute(() => pm2Service.restart())

		if (actionResult !== true) {
			return actionResult
		}

		availablePort = serverPort
	} catch (e) {
		logger.error(e, lc({req}))

		const rollbackStatuses = []
		const postRollbackInfo = {}

		if (!parseBoolean(req.body.skipRollback)) {
			await fileActionsHelper.rollBackDeleted()
				.then(
					status => rollbackStatuses.push({for: 'rollBackDeleted', status: !!status}),
					err => {
						rollbackStatuses.push({for: 'rollBackDeleted', status: 'error', reason: err})
						throw err
					},
				)
				.then(() => envConfigSetterService.rollBack())
				.then(
					status => rollbackStatuses.push({for: 'rollBackEnvConfigSetter', status: !!status}),
					err => {
						rollbackStatuses.push({for: 'rollBackEnvConfigSetter', status: 'error', reason: err})
						throw err
					},
				)
				.then(async () => {
					if (await pm2Service.willRestartOnRollback()) {
						const {
							serverPort,
							actionResult: status,
						} = await new EnvConfigSetterService(appConfig, appId)
							.execute(() => pm2Service.rollback())

						return {
							status,
							postRollbackInfo: status === true
							                  ? await setNginxRoute(serverPort, appConfig, {req})
							                  : status,
						}
					}

					return {status: await pm2Service.rollback()}
				})
				.then(
					({status, postRollbackInfo: _postRollbackInfo}) => {
						Object.assign(postRollbackInfo, _postRollbackInfo)
						return rollbackStatuses.push({for: 'pm2Rollback', status: !!status})
					},
					err => {
						rollbackStatuses.push({for: 'pm2Rollback', status: 'error', reason: err})
						throw err
					},
				)
				.catch(err => {
					logger.error('Rollback error', err)
					return err
				})
		}

		/*
			todo: dont send host/server related infos
			ex: for script not found error, its sending the absolute app deployment path
		 */
		throw new RollbackStatusesWithBaseReason(e.toString(), rollbackStatuses, postRollbackInfo)
	}

	return setNginxRoute(availablePort, appConfig, {req})
}
