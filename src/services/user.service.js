import {UserAlreadyExistsError, UserNotfoundError} from '../errors/errors'
import {userRepo} from '../repo'
import {encrypt} from '../utils/enc-dec.utils'
import {throwIfNull} from '../utils/utils'

export async function getUserByUserName(userName) {
	return throwIfNull(
		await userRepo.findOne({userId: userName}, {include: 'userPassword'}),
		() => new UserNotfoundError(UserNotfoundError.BY.USER_NAME, userName),
	)
}

export async function create(userDetails) {
	if (await userRepo.findOne({userId: userDetails.userName})) {
		throw new UserAlreadyExistsError(UserNotfoundError.BY.USER_NAME, userDetails.userName)
	}
	if (userDetails.email && await userRepo.findOne({email: userDetails.email})) {
		throw new UserAlreadyExistsError(UserNotfoundError.BY.EMAIL, userDetails.email)
	}
	if (userDetails.mobileNo && await userRepo.findOne({mobileNo: userDetails.mobileNo})) {
		throw new UserAlreadyExistsError(UserNotfoundError.BY.MOBILE_NO, userDetails.mobileNo)
	}

	userDetails.userId = userDetails.userName
	userDetails.userPassword = {}
	userDetails.userPassword.password = await encrypt(userDetails.password)

	return userRepo.insert(userDetails, {include: 'userPassword'})
}

export async function changePassword(userDetails) {
	const {dataValues: user} = await getUserByUserName(userDetails.userName)

	user.userPassword.password = await encrypt(userDetails.password)

	return userRepo.update(user, {where: {userId: userDetails.userName}, include: 'userPassword'})
}
