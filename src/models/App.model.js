import {DataTypes} from 'sequelize'
import {beforeCreate, beforeUpdate} from '../utils/repo.utils'

export default conn => {
	conn.define(
		'App',
		{
			id: {
				type: DataTypes.STRING,
				primaryKey: true,
				allowNull: false,
			},
			appName: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			package: {
				type: DataTypes.STRING,
			},
			appAbsolutePath: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			backupPath: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			dataPath: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			nginxRoutePath: {
				type: DataTypes.STRING,
			},
			createdOn: {
				type: DataTypes.DATE,
			},
			updatedOn: {
				type: DataTypes.DATE,
			},
		},
		{
			tableName: 'app',
			timestamps: false,
			hooks: {
				beforeCreate,
				beforeUpdate,
			},
		},
	)
}
