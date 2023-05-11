import archiver from 'archiver'
import axios from 'axios'
import FormData from 'form-data'
import minimist from 'minimist'

const nodeModulesToZip = minimist(process.argv.slice(2)).ibd ? [] : ['node_modules/**']

const CONFIG = {
	// DEPLOYMENT_API_URL: 'http://10.21.54.93:3500/api/deploy',
	// APP_NAME: 'code-deployer-dev',
	DEPLOYMENT_API_URL: 'http://10.21.86.161:3500/api/deploy',
	APP_NAME: 'code-deployer',
	DEPLOYMENT_IGNORE_DELETE: [
		'logs/**',
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

console.log('Deploying to host ...')
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
