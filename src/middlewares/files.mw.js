import multer from 'multer'

export function formDataFileToBufferMw() {
	const upload = multer({
		storage: multer.memoryStorage(),
		limits: {fileSize: 1024 * 1024 * 1024 * 1}, // limit file size to 10MB
	})

	return upload.single('file')
}
