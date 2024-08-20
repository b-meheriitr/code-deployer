class UserAuthenticationSessionRepo {
	constructor({conn}) {
		this.conn = conn
		this.UserAuthenticationSession = conn.models.UserAuthenticationSession
	}

	insert = (record, opts = {}) => {
		return this.UserAuthenticationSession.create(record, opts)
	}

	update = (updatedRecord, opts = {}) => {
		return this.UserAuthenticationSession.update(
			updatedRecord.dataValues || updatedRecord,
			{where: {sessionId: updatedRecord.sessionId}, ...opts},
		)
	}

	// eslint-disable-next-line class-methods-use-this
	decrementAttempt = async (record, opts = {}) => {
		await record.decrement('attemptsRemaining', {by: 1, ...opts})
		return this.findById(record.sessionId)
	}

	findById = sessionId => {
		return this.UserAuthenticationSession.findOne({where: {sessionId}})
	}
}

export default conn => ({...new UserAuthenticationSessionRepo(conn)})
