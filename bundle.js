// eslint-disable-next-line import/no-extraneous-dependencies
const esbuild = require('esbuild')

esbuild.build({
	entryPoints: ['./src/bin/www.js'],
	bundle: true,
	outfile: 'dist/bundle/app.min.js',
	platform: 'node',
	sourcemap: 'inline',
	minify: true,
	metafile: true,
})
	.then(({metafile}) => console.log(esbuild.analyzeMetafileSync(metafile)))
	.catch(() => process.exit(1))
