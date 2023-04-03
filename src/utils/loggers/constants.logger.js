export const levelsOrder = [
	{
		level: 'error',
		color: 'red',
	},
	{
		level: 'warn',
		color: 'yellow',
	},
	{
		level: 'api-requests',
		color: 'blue',
	},
	{
		level: 'info',
		color: 'green',
	},
	{
		level: 'debug',
		color: 'white',
	},
	{
		level: 'trace',
		color: 'italic red',
	},
	{
		level: 'silly',
		color: 'grey',
	},
]

export const levelNames = levelsOrder.map(lwc => lwc.level).map(level => ({level}))

export const winstonLevelColors = levelsOrder.reduce((colors, level) => {
	colors[level.level] = level.color
	return colors
}, {})

export const winstonLevels = levelNames.reduce((levelsObj, level, idx) => {
	levelsObj[level.level] = idx
	return levelsObj
}, {})

export const SPLAT_SYMBOL = Symbol.for('splat')
