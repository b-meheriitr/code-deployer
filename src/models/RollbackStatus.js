export class RollbackStatusesWithBaseReason {
	constructor(baseReason, statuses, postRollbackInfo) {
		this.baseReason = baseReason
		this.rollBackStatuses = statuses
		this.postRollbackInfo = postRollbackInfo
	}
}
