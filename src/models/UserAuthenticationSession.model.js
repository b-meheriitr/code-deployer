import {Sequelize} from 'sequelize'
import {beforeCreate, beforeUpdate} from '../utils/repo.utils'

export default conn => {
	return conn.define('UserAuthenticationSession', {
		sessionId: {
			type: Sequelize.TEXT,
			primaryKey: true,
			allowNull: false,
		},
		userId: {
			type: Sequelize.INTEGER,
		},
		authenticationMechanism: {
			type: Sequelize.TEXT,
		},
		authenticatedOn: {
			type: Sequelize.DATE,
		},
		expiresAt: {
			type: Sequelize.DATE,
		},
		createdOn: {
			type: Sequelize.DATE,
		},
		requestId: {
			type: Sequelize.INTEGER,
		},
		authenticatedFromIp: {
			type: Sequelize.INTEGER,
			allowNull: true,
		},
		attemptsRemaining: {
			type: Sequelize.INTEGER,
		},
	}, {
		timestamps: false,
		tableName: 'user_authentication_session',
		hooks: {
			beforeCreate,
			beforeUpdate,
		},
	})
}
