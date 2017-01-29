/*global angular */

/**
 * The New List controller.
 */
angular.module('todomvc')
	.controller('NewListCtrl', function NewListCtrl($scope, $routeParams, $location, store, appPaths) {
		'use strict';

		$scope.newListNameExists = function () {
			return $scope.newListName in store.lists;
		};
		$scope.createList = function () {
			var listName = ($scope.newListName || '').trim();
			if (!listName) {
				return;
			}
			$scope.saving = true;
			store.insert({name: listName})
				.then(function success() {
					$location.path(appPaths.listPath(listName));
				})
				.finally(function () {
					$scope.saving = false;
				});
		};
	});
