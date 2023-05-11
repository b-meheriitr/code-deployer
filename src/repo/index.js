import {Sequelize} from 'sequelize'
import {DATABASES_CONFIG} from '../config'
import AppPortModel from '../models/AppPort.model'
import logger from '../utils/loggers'
import appPortRepoTemplate from './app-port.repo'
import migrationScript from './migration'

export const DEFAULT_DATABASE = DATABASES_CONFIG[DATABASES_CONFIG.default]

export const sequelize = new Sequelize({
	...DEFAULT_DATABASE,
	logging: DATABASES_CONFIG.logging || false,
})

// eslint-disable-next-line no-underscore-dangle
Sequelize.DATE.prototype._stringify = function _stringify(date, options) {
	// eslint-disable-next-line no-underscore-dangle
	return this._applyTimezone(date, options).format('YYYY-MM-DD HH:mm:ss.SSS')
}

export default sequelize.authenticate()
	.then(
		() => logger.info(`${DEFAULT_DATABASE.dialect} db connection has been established successfully`),
		error => logger.error('Unable to connect to the database:', error),
	)

migrationScript(sequelize).then(() => logger.info('Migration scripts executed successfully'))

const AppPort = AppPortModel(sequelize)

export const appPortRepo = appPortRepoTemplate({conn: sequelize})
