class AppRepo {
	constructor({conn}) {
		this.conn = conn
		this.App = conn.models.App
	}

	findByAppId = (appId, opts = {}) => {
		return this.App.findByPk(appId, opts)
	}

	insert = (record, opts = {}) => {
		return this.App.create(record, opts)
	}

	update = (updatedRecord, opts) => {
		return this.App.update(updatedRecord, opts)
	}

	upsert = (record, opts = {}) => {
		return this.App.upsert(record, opts)
	}

	findOne = (where, opts = {}) => {
		return this.App.findOne({where}, opts)
	}

	findAll = (opts = {}) => {
		return this.App.findAll(opts)
	}

	exists = (appId, opts = {}) => {
		return this.App.count({where: {id: appId}}, opts).then(count => count > 0)
	}
}

export default conn => ({...new AppRepo(conn)})
