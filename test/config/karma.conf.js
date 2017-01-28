module.exports = function (config) {
	'use strict';

	config.set({
		basePath: '../../',
		frameworks: ['jasmine'],
		files: [
			'public/lib/angular.js',
			'public/lib/angular-route.js',
			'public/lib/angular-resource.js',
			'node_modules/angular-mocks/angular-mocks.js',
			'public/js/**/*.js',
			'test/unit/**/*.js'
		],
		autoWatch: true,
		singleRun: false,
		browsers: ['Chrome', 'Firefox']
	});
};
