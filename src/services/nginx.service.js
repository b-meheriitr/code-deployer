import {promises as fs} from 'fs'
import path from 'path'
import {APP_CONFIG} from '../config'
import {runCommand} from '../utils/os.utils'

const NGINX_CONF = APP_CONFIG.NGINX

const buildConfigContent = config => {
	return `location /${config.path}/ {
				proxy_pass http://localhost:${config.targetPort}/;
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
		this.#configFilePath = path.join(NGINX_CONF.DYNAMIC_CONFS_DIR, `${this.app.name}.conf`)
	}

	// eslint-disable-next-line class-methods-use-this
	#reloadNginx() {
		const nginxExecPath = NGINX_CONF.EXECUTABLE_PATH || 'nginx'
		return runCommand(`${nginxExecPath} -s reload`)
	}

	async createRoute() {
		const {app} = this
		const newRoutePath = `${app.name}`
		const newConfigContent = buildConfigContent({path: newRoutePath, targetPort: app.port})

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

	setNewPort(newPort) {
		this.app.port = newPort
	}

	async rollBack() {
		if (this.#writeNewConfigSuccess !== undefined) {
			if (this.#oldConfigContent !== undefined) {
				await fs.writeFile(this.#configFilePath, this.#oldConfigContent)
			}
		}

		if (this.#nginxReloadSuccess !== undefined) {
			await this.#reloadNginx()
		}

		return Promise.resolve(this.#creationSuccess !== undefined)
	}
}
