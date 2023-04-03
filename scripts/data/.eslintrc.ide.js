const defaultConfig = require('../../.eslintrc')
const ideConfig = require('./.eslintrc.ide.json')
const merge = require('lodash.merge')

module.exports = merge(defaultConfig, ideConfig)
