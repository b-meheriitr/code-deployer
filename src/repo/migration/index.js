import {promises as fs} from 'fs'
import path from 'path'
import {DATABASES_CONFIG} from '../../config'

const DEFAULT_DATABASE = DATABASES_CONFIG[DATABASES_CONFIG.default]

export default async conn => {
	const {dialect} = DEFAULT_DATABASE

	switch (dialect) {
		case 'sqlite':
			await fs.mkdir(path.dirname(DEFAULT_DATABASE.storage), {recursive: true})
			break
		default:
			break
	}

	return conn.query(await fs.readFile(path.join(__dirname, `migration.${dialect}.sql`), 'utf-8'))
}
