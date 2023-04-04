import multer from 'multer'
import {verifyIncomingZipBuffer} from '../utils/files.utils'

export function formDataFileToBufferMw() {
	const upload = multer({
		storage: multer.memoryStorage(),
		limits: {fileSize: 1024 * 1024 * 1024 * 1}, // limit file size to 10MB
	})

	return upload.single('file')
}

export function verifyIncomingZip(req, res, next) {
	try {
		verifyIncomingZipBuffer(req.file.buffer)
		next()
	} catch (err) {
		next(err)
	}
}
