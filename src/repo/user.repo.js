class UserRepo {
	constructor({conn}) {
		this.conn = conn
		this.User = conn.models.User
	}

	findOne = (where, opts = {}) => {
		return this.User.findOne({where, ...opts})
	}

	insert = (record, opts = {}) => {
		return this.User.create(record, opts)
	}

	update = (record, opts = {}) => {
		return this.User.update(record, opts)
	}
}

export default conn => ({...new UserRepo(conn)})
