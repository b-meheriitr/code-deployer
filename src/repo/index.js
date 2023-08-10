import {Sequelize} from 'sequelize'
import {DATABASES_CONFIG} from '../config'
import AppModel from '../models/App.model'
import AppPortModel from '../models/AppPort.model'
import BuildDeploymentHistoryModel from '../models/BuildDeploymentHistory.model'
import logger from '../utils/loggers'
import appPortRepoTemplate from './app-port.repo'
import appTemplate from './app.repo'
import buildDeploymentHistoryTemplate from './build-deployment-history.repo'
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
const App = AppModel(sequelize)
const BuildDeploymentHistory = BuildDeploymentHistoryModel(sequelize)

export const appPortRepo = appPortRepoTemplate({conn: sequelize})
export const appRepo = appTemplate({conn: sequelize})
export const buildDeploymentHistoryRepo = buildDeploymentHistoryTemplate({conn: sequelize})
