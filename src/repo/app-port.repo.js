class AppPortRepo {
	constructor({conn}) {
		this.conn = conn
		this.AppPort = conn.models.AppPort
	}

	findOne = (where, opts = {}) => {
		return this.AppPort.findOne({where}, opts)
	}

	insert = (record, opts = {}) => {
		return this.AppPort.create(record, opts)
	}

	update = (updatedRecord, opts) => {
		return this.AppPort.update(updatedRecord, opts)
	}

	getPortMax = (hostName, opts = {}) => this.AppPort.max('port', {where: {hostName}, ...opts})

	delete = (hostName, appId, opts) => this.AppPort.destroy({where: {appId, hostName}, ...opts})
}

export default conn => ({...new AppPortRepo(conn)})
