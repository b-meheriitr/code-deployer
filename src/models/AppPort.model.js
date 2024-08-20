import {DataTypes} from 'sequelize'
import {beforeCreate, beforeUpdate} from '../utils/repo.utils'

export default conn => {
	return conn.define(
		'AppPort',
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			hostName: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			port: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			appId: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			createdOn: {
				type: DataTypes.DATE,
			},
			updatedOn: {
				type: DataTypes.DATE,
			},
		},
		{
			tableName: 'app-port',
			timestamps: false,
			hooks: {
				beforeCreate,
				beforeUpdate,
			},
		},
	)
}
