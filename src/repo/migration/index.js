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

	// bug: this will crash if ';' is present at any place other than line separator
	const sqlScript = await fs.readFile(path.join(__dirname, `migration.${dialect}.sql`), 'utf-8')
	const queries = sqlScript.split(';').filter(query => query.trim() !== '')

	// eslint-disable-next-line no-restricted-syntax
	for (const query of queries) {
		// eslint-disable-next-line no-await-in-loop
		await conn.query(query)
	}
}
