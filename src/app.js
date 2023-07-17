import express from 'express'
import {API_CONFIG, isDevEnv} from './config'
import router from './routes'
import {logUncaughtError, requestResponseMetaInfoLogger} from './utils/loggers/requests.logger'
import {filterOutNodeModuleStacks} from './utils/loggers/utils.logger'
import {dateString, sendJsonCheckingHeadersSent, uuid} from './utils/utils'

const app = express()
app.disable('x-powered-by')

app.use((req, res, next) => {
	const reqTime = dateString()
	const reqId = uuid()

	req.timeStamp = reqTime
	req.requestId = reqId
	req.userId = 'user-id' // todo: this has to be taken from authentication mechanism

	res.set({
		'Time-Stamp': reqTime,
		'Trace-Id': reqId,
	})

	next()
})

app.use(requestResponseMetaInfoLogger())
app.use(express.json())
app.use(express.urlencoded({extended: false}))

app.use(API_CONFIG.BASE_PATH, router)

app.use((err, req, res, next) => {
	logUncaughtError(err, req)

	let resBody = {message: 'Something went wrong'}

	if (isDevEnv) {
		resBody = {
			...resBody,
			cwd: process.cwd(),
			trace: filterOutNodeModuleStacks(err),
		}
	}

	sendJsonCheckingHeadersSent({res, status: 500, json: resBody})
})

export default app
