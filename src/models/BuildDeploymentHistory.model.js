import {DataTypes} from 'sequelize'

export default conn => {
	return conn.define(
		'BuildDeploymentHistory',
		{
			id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				primaryKey: true,
				autoIncrement: true,
			},
			appId: {
				type: DataTypes.INTEGER,
			},
			buildOrDeployment: {
				type: DataTypes.STRING,
				field: 'build_or_deployment',
			},
			initTime: {
				type: DataTypes.TIME,
				field: 'init_time',
			},
			endTime: {
				type: DataTypes.TIME,
				field: 'end_time',
			},
			totalTime: {
				type: DataTypes.TIME,
				field: 'total_time_in_ms',
			},
			userId: {
				type: DataTypes.INTEGER,
			},
			userIp: {
				type: DataTypes.STRING,
			},
			requestId: {
				type: DataTypes.STRING,
			},
			error: {
				type: DataTypes.STRING,
				field: 'error',
			},
		},
		{
			tableName: 'build-deployment-history',
			timestamps: false,
		},
	)
}
