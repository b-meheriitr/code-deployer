import {Sequelize} from 'sequelize'
import {beforeCreate, beforeUpdate} from '../../utils/repo.utils'

export default conn => {
	return conn.define(
		'UserPassword',
		{
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				allowNull: false,
				autoIncrement: true,
			},
			userId: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			password: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
			createdOn: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			modifiedOn: {
				type: Sequelize.DATE,
				allowNull: true,
			},
		},
		{
			timestamps: false,
			tableName: 'user_password',
			hooks: {
				beforeCreate,
				beforeUpdate,
			},
		},
	)
}
