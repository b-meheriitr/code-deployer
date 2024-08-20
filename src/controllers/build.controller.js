/* eslint-disable no-underscore-dangle,no-restricted-syntax,no-await-in-loop */
import fsSync, {promises as fs} from 'fs'
import path from 'path'
import {APP_CONFIG} from '../config'
import APPS_TYPE from '../consts/app-type'
import {AppValidationError} from '../errors/errors'
import {getPm2FileConfig} from '../services/pm2.service'
import {copyFilePatterns, deleteFolder, unzipBufferStream, zipDir} from '../utils/files.utils'
import {runCommand} from '../utils/os.utils'
import {getAppId, getPackagePath, sendMessage} from '../utils/utils'

function getArtifactZipPath(app, zipFileName) {
	return path.join(
		APP_CONFIG.CODE_BUILDER.ARTIFACTS_DIR,
		getPackagePath(app._info.package),
		app.name,
		zipFileName,
	)
}

function getBuildInfo(type) {
	if (type === APPS_TYPE.REACTJS) {
		return {
			commands: [
				'npm install --include=dev',
				'npm run build',
			],
			buildPath: './build',
			cleanCodeBaseIgnoreDelete: ['node_modules/**'],
		}
	}
	if (type === APPS_TYPE.NODE_JS) {
		return {
			commands: [
				'npm install --include=dev',
				'npm run build',
			],
			buildPath: './dist/build',
			cleanCodeBaseIgnoreDelete: ['node_modules/**'],
		}
	}
	if (type === APPS_TYPE.DOTNET) {
		return {
			commands: [
				'dotnet restore',
				'dotnet publish -c release -o ./publish',
			],
			buildPath: './publish',
			cleanCodeBaseIgnoreDelete: ['obj/**', 'bin/**'],
		}
	}
	if (type === APPS_TYPE.PYTHON) {
		return {
			commands: [
				'source venv/bin/activate && pip install -r requirements.txt',
			],
			buildPath: './build',
			cleanCodeBaseIgnoreDelete: [
				'venv/**',
			],
		}
	}

	throw new AppValidationError(`Invalid app type ${type} for build`)
}

const getDependencyPackageFilePatterns = ({dependencyPackagesFilePatterns}) => {
	return dependencyPackagesFilePatterns
}

export default async (req, res) => {
	res.setHeader('Content-Type', 'text/event-stream')
	res.setHeader('Cache-Control', 'no-cache')
	res.setHeader('Connection', 'keep-alive')

	sendMessage(res, 'Received request')

	const [app] = await getPm2FileConfig(getAppId(req))

	const codeBaseDir = path.join(
		APP_CONFIG.CODE_BUILDER.CODEBASE_DIR,
		getPackagePath(app._info.package),
		app.name,
	)

	const buildInfo = {
		...getBuildInfo(app._info.type || APPS_TYPE.NODE_JS),
		...(req.body.buildInfo),
	}
	buildInfo.cleanCodeBaseIgnoreDelete?.push(buildInfo.buildPath)
	buildInfo.buildPath = path.join(codeBaseDir, buildInfo.buildPath)

	sendMessage(res, 'Deleting existing codebase')
	await deleteFolder(codeBaseDir, buildInfo.cleanCodeBaseIgnoreDelete)
	sendMessage(res, 'Deleting existing codebase -- completed')

	sendMessage(res, 'Unzipping incoming codebase')
	await unzipBufferStream(req.file.buffer, codeBaseDir)
	sendMessage(res, 'Unzipping incoming codebase -- completed')

	for (const command of buildInfo.commands) {
		sendMessage(res, `⏳ running command '${command}'`)

		const timeStart = new Date().getTime()
		const {stderr, stdout, commandError} = await runCommand(command, codeBaseDir)
			.catch(err => ({commandError: err}))

		const timeTaken = new Date().getTime() - timeStart

		stdout && sendMessage(res, `ℹ️ ${stdout}`, 'command-message')
		stderr && sendMessage(res, `⚠️ ${stderr}`, 'command-warning')
		if (commandError) {
			req.error = commandError
			sendMessage(res, `❌ ${commandError}`, 'command-error')
			sendMessage(res, 'Aborting build subsequent build steps, See ya soon !! 🙂')
			return res.end()
		}

		sendMessage(res, `✅ completed '${command}' in ${timeTaken > 1000 ? `${timeTaken / 1000}s` : `${timeTaken}ms`}`)
	}

	await copyFilePatterns(
		req.body.projectConfig.build.copyFiles,
		path.join(codeBaseDir, req.body.projectConfig.build.buildPath),
		codeBaseDir,
	)

	if (req.body.includeDependencyPackages) {
		await copyFilePatterns(
			req.body.dependencyPackagesFilePatterns,
			buildInfo.buildPath,
			codeBaseDir,
		)
	}

	sendMessage(res, 'build finished')

	// todo: increment the artifact version
	const buildZipFileName = `build-${new Date().getTime()}-${app.name}.zip`
	const buildZipPath = getArtifactZipPath(app, buildZipFileName)

	sendMessage(res, 'Zipping build and saving as artifact')

	await zipDir(
		buildInfo.buildPath,
		buildZipPath,
		req.body.includeDependencyPackages ? [] : getDependencyPackageFilePatterns(req.body),
	)
	sendMessage(res, 'Zipping build and saving as artifact -- completed')
	sendMessage(res, `To download the artifact zip, pass this artifactZipName: ${buildZipFileName} in download-artifact-zip API`)

	if (req.body.downloadBuildZip) {
		sendMessage(res, `attachment name: ${buildZipFileName}`, 'info-attachment')
		sendMessage(res, 'downloading zip')

		return fsSync.createReadStream(buildZipPath).pipe(res)
	}

	return res.end()
}

export const downloadArtifactZip = async (req, res) => {
	const [app] = await getPm2FileConfig(getAppId(req))

	const filePath = getArtifactZipPath(app, req.params.artifactZipNameOrId)

	if (await fs.stat(filePath).then(s => s.isFile(), () => false)) {
		res.download(filePath)
	} else {
		res.status(404).json({message: 'Artifact zip not found'})
	}
}
