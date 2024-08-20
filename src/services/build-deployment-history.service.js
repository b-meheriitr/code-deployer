import {buildDeploymentHistoryRepo} from '../repo'
import {getAppId, now, toLocalDateString} from '../utils/utils'

function createRecord({req, startTime, endTime, error}, type = 'deployment') {
	return {
		appId: getAppId(req),
		buildOrDeployment: type,
		initTime: toLocalDateString(startTime),
		endTime: toLocalDateString(endTime),
		totalTime: endTime.diff(startTime, 'milliseconds'),
		// todo
		userId: req.user?.userId,
		userIp: req.clientIp,
		requestId: req.requestId,
		error: error && (error instanceof Error) ? error.stack : JSON.stringify(error),
	}
}

async function log(action, logAction, req) {
	const values = {startTime: now()}

	const actionResult = await action()
		.then(result => {
			values.error = req.error
			return result
		})
		.catch(e => {
			values.error = e
		})
		.finally(() => {
			values.endTime = now()
		})

	return logAction(values)
		.catch(f => f)
		.then(() => {
			if (values.error) {
				throw values.error
			}
			return actionResult
		})
}

export function logBuildHistoryRecord(buildAction, req) {
	return log(
		buildAction,
		values => {
			return buildDeploymentHistoryRepo.insert(createRecord({...values, req}, 'build'))
		},
		req,
	)
}

export function logDeploymentHistoryRecord(deploymentAction, req) {
	return log(
		deploymentAction,
		values => {
			return buildDeploymentHistoryRepo.insert(createRecord({...values, req}))
		},
		req,
	)
}

export function getBuildHistory() {
	return buildDeploymentHistoryRepo.findAll({
		where: {buildOrDeployment: 'build'},
		order: [['initTime', 'DESC']],
	})
}

export function getDeploymentHistory() {
	return buildDeploymentHistoryRepo.findAll({
		where: {buildOrDeployment: 'deployment'},
		order: [['initTime', 'DESC']],
	})
}
