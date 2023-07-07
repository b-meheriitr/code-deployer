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
}

export default conn => ({...new AppRepo(conn)})
