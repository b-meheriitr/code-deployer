#!/usr/bin/env node
/**
 * init env variables
 */
require('dotenv').config()

process.env.NODE_ENV = process.env.NODE_ENV || 'locdev'

const debug = require('debug')('exp-test:server')
const http = require('http')
const logger = require('../utils/loggers').default
const app = require('../app').default
const {SERVER: {PORT: SERVER_PORT}, ENV} = require('../config').default

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(SERVER_PORT)
app.set('port', port)

/**
 * Create HTTP server.
 */
const server = http.createServer(app)

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
	const intPort = parseInt(val, 10)

	if (isNaN(intPort)) {
		// named pipe
		return val
	}

	if (intPort >= 0) {
		// port number
		return intPort
	}

	return false
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
	if (error.syscall !== 'listen') {
		throw error
	}

	const bind = typeof port === 'string'
		? `Pipe ${port}`
		: `Port ${port}`

	// handle specific listen errors with friendly messages
	switch (error.code) {
		case 'EACCES':
			logger.error(`${bind} requires elevated privileges`)
			break
		case 'EADDRINUSE':
			logger.error(`${bind} is already in use`)
			break
		default:
			throw error
	}
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
	const addr = server.address()
	const bind = typeof addr === 'string'
		? `pipe ${addr}`
		: `port ${addr.port}`
	debug(`Listening on ${bind}`)
	logger.info(`Listening on port ${port}, environment: ${ENV}`)
}
