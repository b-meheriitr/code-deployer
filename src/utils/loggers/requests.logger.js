import morgan from 'morgan'
import {LOGGING_CONFIG} from '../../config'
import {lc} from './models.logger'
import {beautifyLogLevel, stackPathToRelativePath} from './utils.logger'
import logger from './index'

export const logUncaughtError = (err, req) => {
	const stack = err.stack.split('\n')
		.map(stackPathToRelativePath)
		.map(line => {
			return line.includes('node_modules')
				? line.replaceAll('node_modules', './$cwd/node_modules')
				: line
		})
		.join('\n')

	logger.error(stack, lc({req}))
}

morgan.token('log-level', (req, res) => {
	let logLevel
	if (res.statusCode >= 500) {
		logLevel = 'error'
	} else if (res.statusCode >= 400) {
		logLevel = 'warn'
	} else {
		logLevel = 'info'
	}
	return beautifyLogLevel(logLevel)
})
morgan.token('request-time', req => req.timeStamp)
morgan.token('request-id', req => req.requestId)
morgan.token('user-id', req => req.userId)

export const requestResponseMetaInfoLogger = () => morgan(
	':request-time :remote-addr | :user-id | :request-id [:log-level] :status :method :url - :response-time ms - :res[content-length]',
	{
		skip: () => LOGGING_CONFIG.SKIP_MORGAN_REQUESTS_LOG,
		stream: {
			write: message => logger['api-requests'](
				message.slice(0, -1), // needed because morgan by default appending '\n' at the message end
				lc({messageOnly: true}),
			),
		},
	},
)
