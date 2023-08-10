class BuildDeploymentHistoryRepo {
	constructor({conn}) {
		this.conn = conn
		this.BuildDeploymentHistory = conn.models.BuildDeploymentHistory
	}

	insert = (record, opts = {}) => {
		return this.BuildDeploymentHistory.create(record, opts)
	}

	findAll = (opts = {}) => {
		return this.BuildDeploymentHistory.findAll(opts)
	}
}

export default conn => ({...new BuildDeploymentHistoryRepo(conn)})
