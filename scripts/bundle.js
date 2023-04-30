import {spawn} from 'child_process'
import esbuild from 'esbuild'
import {promises as fs} from 'fs'
import _ from 'lodash'
import minimist from 'minimist'
import path from 'path'
import projectPackageJson from '../package.json'

const packagesInstallationPath = 'dist/bundle'
const bundledDependencies = ['fsevents', 'pm2-deploy']

function isBundledDepsAllDeps() {
	return bundledDependencies === '*' || bundledDependencies[0] === '*'
}

const runCommand = (command, args, cwd = null) => {
	return new Promise((resolve, reject) => {
		const process = spawn(command, args, {cwd})

		process.stdout.on('data', data => {
			console.log(data.toString())
		})

		process.stderr.on('data', data => {
			console.error(data.toString())
		})

		process.on('close', code => {
			if (code === 0) {
				resolve()
			} else {
				reject(new Error(`Command '${command} ${args.join(' ')}' exited with code ${code}`))
			}
		})
	})
}

function createPackageJsonFile() {
	return fs.writeFile(
		path.join(packagesInstallationPath, 'package.json'),
		JSON.stringify(
			_.pick(
				projectPackageJson,
				[
					'name',
					'engines',
					...(isBundledDepsAllDeps()
							? ['dependencies']
							: bundledDependencies.map(b => (`dependencies.${b}`))
					)
					,
				],
			),
			null,
			2,
		),
	)
}

async function installPackages() {
	await fs.cp('package-lock.json', path.join(packagesInstallationPath, 'package-lock.json'))

	return runCommand('npm', ['install', `--prefix=${path.join(process.cwd(), packagesInstallationPath)}`])
		.then(() => fs.rm(path.join(packagesInstallationPath, 'package-lock.json')))
}

export default esbuild.build({
	entryPoints: ['src/bin/www.js'],
	bundle: true,
	outfile: path.join(packagesInstallationPath, 'app.min.js'),
	platform: 'node',
	sourcemap: 'inline',
	minify: true,
	metafile: true,
	external: isBundledDepsAllDeps() ? Object.keys(projectPackageJson.dependencies) : bundledDependencies,
})
	.then(({metafile}) => console.log(esbuild.analyzeMetafileSync(metafile)))
	.then(() => createPackageJsonFile())
	.then(() => {
		if (minimist(process.argv.slice(2)).ibd) { // ibd stand for installBundledDependencies
			console.log('installing non-bundled packages')
			return installPackages()
				.then(
					() => console.log('Packages installed successfully'),
					err => console.error(`Error installing packages: ${err.stack}`),
				)
		}
	})
	.catch(err => {
		console.error(err)
		return process.exit(1)
	})
