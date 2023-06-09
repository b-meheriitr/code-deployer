import archiver from 'archiver'
import axios from 'axios'
import FormData from 'form-data'
import fsSync, {promises as fs} from 'fs'
import minimist from 'minimist'
import moment from 'moment'
import path from 'path'

const nodeModulesToZip = minimist(process.argv.slice(2)).ibd ? [] : ['node_modules/**']

const onlyZip = !!minimist(process.argv.slice(2)).zip
const zipStorageDirectory = 'dist/zips'

const CONFIG = {
	// DEPLOYMENT_API_URL: 'http://10.21.54.93:3500/api/deploy',
	// APP_NAME: 'code-deployer-dev',
	DEPLOYMENT_API_URL: 'http://10.21.86.161:3500/api/deploy',
	APP_NAME: 'code-deployer',
	DEPLOYMENT_IGNORE_DELETE: [
		'logs/**',
		'data/**',
		...nodeModulesToZip,
	],
	FILES_TO_ZIP: [
		{
			pattern: 'config/**/*',
			cwd: './',
			ignore: [],
		},
		{
			pattern: '**/*',
			cwd: './dist/bundle',
			ignore: nodeModulesToZip,
		},
		{
			pattern: '.env*',
			cwd: './',
		},
		{
			pattern: '*.sql',
			cwd: 'src/repo/migration',
		},
	],
}

const createZipArchiveStream = () => {
	const archive = archiver('zip', {zlib: {level: 9}})

	CONFIG.FILES_TO_ZIP
		.forEach(({pattern, cwd, ignore}) => {
			archive.glob(pattern, {cwd, ignore, dot: true})
		})

	archive.finalize()

	return archive
}

const buildFormData = (archive, ignoreDelete) => {
	const formData = new FormData()
	formData.append('file', archive, {filename: 'build.zip'})
	formData.append('ignoreDelete', JSON.stringify(ignoreDelete))

	return formData
}

const formData = buildFormData(createZipArchiveStream(), CONFIG.DEPLOYMENT_IGNORE_DELETE)

if (onlyZip) {
	new Promise(async (resolve, reject) => {
		const outFile = path.join(
			zipStorageDirectory,
			`${CONFIG.APP_NAME}-${moment().format('DD-MM-YYYY_HH-mm-ss')}.zip`,
		)
		await fs.mkdir(path.dirname(outFile), {recursive: true})

		const outputStream = fsSync.createWriteStream(outFile)
		const archiver = createZipArchiveStream()

		archiver.on('error', (err) => reject(err))
		outputStream.on('error', (err) => reject(err))
		outputStream.on('close', () => resolve(outFile))

		archiver.pipe(outputStream)
	})
		.then((out) => console.log('done zipping', out))
} else {
	console.log('Deploying to host ...')
	const startTime = new Date().getTime()

	axios({
		method: 'POST',
		url: CONFIG.DEPLOYMENT_API_URL,
		data: formData,
		headers: {
			...formData.getHeaders(),
			'app-name': CONFIG.APP_NAME,
		},
	})
		.then(
			response => console.log(response.status, JSON.stringify(response.data, null, 4)),
			(err) => {
				if (err.response) {
					console.log('Api ERROR', err.response.status, JSON.stringify(err.response.data, null, 4))
				} else {
					console.log(err.message)
				}
			},
		)
		.finally(() => console.log('time: ', (new Date().getTime() - startTime) / 1000))
}
