import AdmZip from 'adm-zip'
import archiver from 'archiver'
import fs from 'fs'
import minimatch from 'minimatch'
import path from 'path'
import {CorruptedIncomingZipError, SourceBackupDirNotExistErr} from '../errors/errors'

const removeFileSync = filePath => fs.rmSync(filePath)

const removeDirSync = (innerDirPath, recursive = false) => {
	try {
		recursive ? fs.rmSync(innerDirPath, {recursive}) : fs.rmdirSync(innerDirPath)
	} catch (e) {
		// no-ops
	}
}

export const createDirectoryRecursiveSync = createDirPath => {
	fs.mkdirSync(createDirPath, {recursive: true})
}

export const backupFiles = (sourceDir, backupOutFilePath, ignore) => {
	if (!fs.existsSync(sourceDir)) {
		throw new SourceBackupDirNotExistErr(sourceDir)
	}

	createDirectoryRecursiveSync(path.dirname(backupOutFilePath))

	const output = fs.createWriteStream(backupOutFilePath)
	const archive = archiver('zip', {zlib: {level: 9}})

	return new Promise((resolve, reject) => {
		archive.glob('**/*', {cwd: sourceDir, ignore})

		archive.on('error', err => reject(err))
			.on('end', f => f)
			.pipe(output)

		output.on('close', () => resolve(backupOutFilePath))

		archive.finalize()
	})
}

function deleteDirRecursivelyIgnoringPatterns(innerDirPath, patterns) {
	if (fs.existsSync(innerDirPath)) {
		fs.readdirSync(innerDirPath)
			.forEach(file => {
				const filePath = path.join(innerDirPath, file)

				if (patterns.some(pattern => minimatch(filePath, pattern))) {
					return
				}
				if (fs.statSync(filePath).isDirectory()) {
					deleteDirRecursivelyIgnoringPatterns(filePath, patterns)
				} else {
					removeFileSync(filePath)
				}
			})

		removeDirSync(innerDirPath)
	}
}

function deleteDirMatchingPattern(innerDirPath, patterns) {
	if (fs.existsSync(innerDirPath)) {
		fs.readdirSync(innerDirPath)
			.forEach(file => {
				const filePath = path.join(innerDirPath, file)

				if (patterns.some(pattern => minimatch(filePath, pattern))) {
					if (fs.statSync(filePath).isDirectory()) {
						removeDirSync(filePath, true)
					} else {
						removeFileSync(filePath)
					}
				} else if (fs.statSync(filePath).isDirectory()) {
					deleteDirMatchingPattern(filePath, patterns)
				}
			})
	}
}

export function deleteFolder(dirPath, ignore = []) {
	let {patternsToIgnore, patternsToNotIgnore} = ignore.reduce((acc, pat) => {
		if (pat.startsWith('!')) {
			acc.patternsToNotIgnore.push(pat.substring(1))
		} else {
			acc.patternsToIgnore.push(pat)
		}

		return acc
	}, {patternsToIgnore: [], patternsToNotIgnore: []})

	patternsToIgnore = patternsToIgnore.map(p => path.join(dirPath, p))
	patternsToIgnore.sort()
	patternsToNotIgnore = patternsToNotIgnore.map(p => path.join(dirPath, p))
	patternsToNotIgnore.sort()

	deleteDirRecursivelyIgnoringPatterns(dirPath, patternsToIgnore)
	deleteDirMatchingPattern(dirPath, patternsToNotIgnore)
}

// bug: hangs subsequent requests if any unzippping fails
// export function unzipBufferStream(buffer, unzipPath) {
// 	return new Promise((resolve, reject) => {
// 		Readable.from([buffer])
// 			.pipe(unzipper.Extract({path: unzipPath}))
// 			.on('error', reject)
// 			.on('end', resolve)
// 	})
// }

const newAdmZip = pathOrBuffer => {
	if (typeof pathOrBuffer === 'string') {
		return new AdmZip(pathOrBuffer)
	}

	if (!pathOrBuffer.singletonAdmZip) {
		pathOrBuffer.singletonAdmZip = new AdmZip(pathOrBuffer)
	}
	return pathOrBuffer.singletonAdmZip
}

const verifyIncomingZipBuffer = pathOrBuffer => {
	try {
		newAdmZip(pathOrBuffer)
	} catch (e) {
		throw new CorruptedIncomingZipError()
	}
}

export {verifyIncomingZipBuffer}

export function unzip(pathOrBuffer, extractPath) {
	createDirectoryRecursiveSync(extractPath)

	return new Promise((resolve, reject) => {
		const zip = newAdmZip(pathOrBuffer)

		zip.extractAllTo(extractPath, true)

		resolve()
	})
}

export function unzipBufferStream(zipStream, extractPath) {
	return unzip(zipStream, extractPath)
}

export class FsActionsHelper {
	#sourceDir

	#backupZipFilePath

	#ignoreDeletePattern

	#ignoreBackupPattern

	#backupSuccess

	#sourceDirExisted

	constructor(sourceDir, backupZipFilePath, ignoreDeletePattern) {
		this.#sourceDir = sourceDir
		this.#backupZipFilePath = backupZipFilePath
		this.#ignoreDeletePattern = ignoreDeletePattern
		// archive is corrupted when used '!' glob pattern
		this.#ignoreBackupPattern = this.#ignoreDeletePattern.filter(p => !p.startsWith('!'))
	}

	async backupSource() {
		try {
			await backupFiles(this.#sourceDir, this.#backupZipFilePath, this.#ignoreBackupPattern)

			this.#sourceDirExisted = true
			this.#backupSuccess = true

			return true
		} catch (err) {
			if (err instanceof SourceBackupDirNotExistErr) {
				this.#sourceDirExisted = false
				this.#backupSuccess = true
				return false
			}
			throw err
		}
	}

	deleteSourceDir() {
		if (this.#sourceDirExisted) {
			return deleteFolder(this.#sourceDir, this.#ignoreDeletePattern)
		}

		return Promise.resolve(0)
	}

	unzipBufferStream(buffer) {
		return unzipBufferStream(buffer, this.#sourceDir)
	}

	async rollBackDeleted() {
		if (this.#backupSuccess !== undefined && this.#backupSuccess) {
			if (this.#sourceDirExisted) {
				await this.#rollBackDeleted(this.#backupZipFilePath, this.#sourceDir)
				return Promise.resolve(1)
			}

			removeDirSync(this.#sourceDir, true)
			removeDirSync(path.dirname(this.#backupZipFilePath), true)
			return Promise.resolve(1)
		}

		return Promise.resolve(0)
	}

	#rollBackDeleted() {
		return unzip(this.#backupZipFilePath, this.#sourceDir)
			.then(() => removeFileSync(this.#backupZipFilePath))
	}
}
