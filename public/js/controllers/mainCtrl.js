/*global angular */

/**
 * The main controller for the app. The controller basically serves as container
 * for child controllers and to pass them "store" service resolved from promises
 * by route's "resolve" trick.
 */
angular.module('todomvc')
	.controller('MainCtrl', function MainCtrl($scope, store) {
		'use strict';

		$scope.store = store; // Make resolved store available to all child controllers.
	});
