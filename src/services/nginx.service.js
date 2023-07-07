import {promises as fs} from 'fs'
import path from 'path'
import {APP_CONFIG} from '../config'
import {isWindowsOs, runCommand} from '../utils/os.utils'

const NGINX_CONF = APP_CONFIG.NGINX

const buildConfigContent = config => {
	if (config.target.path) {
		return `location /${config.path} {    
                    alias ${config.target.path};
                    try_files $uri $uri/ /index.html =404;    
                }\n`
	}

	return `location /${config.path}/ {
				proxy_pass http://localhost:${config.target.port}/;
			}\n`
}

export default class NginxUtil {
	#configFilePath

	#oldConfigContent

	#writeNewConfigSuccess

	#nginxReloadSuccess

	#creationSuccess

	constructor(appInfo) {
		this.app = appInfo
		this.#configFilePath = path.join(NGINX_CONF.DYNAMIC_CONFS_DIR, `${this.app.id}.conf`)
	}

	// eslint-disable-next-line class-methods-use-this
	#reloadNginx() {
		const nginxExecPath = NGINX_CONF.EXECUTABLE_PATH || 'nginx'
		return runCommand(
			`${nginxExecPath} -s reload`,
			isWindowsOs() ? path.dirname(NGINX_CONF.EXECUTABLE_PATH) : undefined,
		)
	}

	async createRoute() {
		const {app} = this
		const newRoutePath = `${app.nginxRoutePath}`
		const newConfigContent = buildConfigContent({
			path: newRoutePath,
			target: {port: app.port, path: app.targetRootPath},
		})

		try {
			await fs.mkdir(path.dirname(this.#configFilePath), {recursive: true})
			this.#oldConfigContent = await fs.readFile(this.#configFilePath, 'utf-8')
				.catch(err => {
					if (/no such file or directory/.test(err.message)) {
						return undefined
					}
					throw err
				})

			await fs.writeFile(this.#configFilePath, newConfigContent)
				.then(
					() => this.#writeNewConfigSuccess = true,
					e => {
						this.#writeNewConfigSuccess = false
						throw e
					},
				)
				.then(this.#reloadNginx)
				.then(
					() => this.#nginxReloadSuccess = true,
					e => {
						this.#nginxReloadSuccess = false
						throw e
					},
				)

			this.#creationSuccess = true
		} catch (e) {
			this.#creationSuccess = false
			throw e
		}

		return {
			port: NGINX_CONF.PORT,
			basePath: `/${newRoutePath}`,
		}
	}

	setNewTargetPortOrPath(targetPortOrPath) {
		if (typeof targetPortOrPath === 'number') {
			this.app.port = targetPortOrPath
			return {port: targetPortOrPath}
		}

		this.app.targetRootPath = targetPortOrPath
		return {}
	}

	async rollBack() {
		if (this.#writeNewConfigSuccess !== undefined) {
			if (this.#oldConfigContent === undefined) {
				await fs.rm(this.#configFilePath)
			} else {
				await fs.writeFile(this.#configFilePath, this.#oldConfigContent)
			}
		}

		if (this.#nginxReloadSuccess !== undefined) {
			await this.#reloadNginx()
		}

		return Promise.resolve(this.#creationSuccess !== undefined)
	}
}
