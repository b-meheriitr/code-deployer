import {Sequelize} from 'sequelize'
import {beforeCreate, beforeUpdate} from '../utils/repo.utils'

export default conn => {
	return conn.define(
		'User',
		{
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			userId: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
			name: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
			mobileNo: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
			email: {
				type: Sequelize.TEXT,
				allowNull: false,
			},
			createdOn: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.NOW,
			},
			modifiedOn: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.NOW,
			},
			inactiveOn: {
				type: Sequelize.DATE,
				allowNull: true,
			},
		},
		{
			timestamps: false,
			tableName: 'user',
			hooks: {
				beforeCreate,
				beforeUpdate,
			},
		},
	)
}
