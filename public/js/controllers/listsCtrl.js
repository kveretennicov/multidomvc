/*global angular */

/**
 * The To Do Lists controller (list of To Do lists).
 */
angular.module('todomvc')
	.controller('ListsCtrl', function TodoCtrl($scope, $routeParams, $location, appPaths) {
		'use strict';

		var store = $scope.store; // From MainCtrl.

		var selectedListName = appPaths.getListName($routeParams);
		var selectedList = store.lists[selectedListName];
		if (!selectedList) {
			$location.path(appPaths.defaultListPath());
			return;
		}

		var onSelectionChanged = function () {
			if ($scope.selectedList) {
				$location.path(appPaths.listPath($scope.selectedList.name));
			}
			else {
				$location.path(appPaths.defaultListPath());
			}
		};

		$scope.lists = store.lists;
		$scope.selectedList = selectedList;
		$scope.canDeleteCurrentList = function () {
			return $scope.selectedList && $scope.selectedList.name !== 'default';
		};
		$scope.deleteCurrentList = function () {
			store.delete($scope.selectedList)
				.then(function success() {
					$location.path(appPaths.defaultListPath());
				});
		};
		$scope.onSelectionChanged = onSelectionChanged;
		$scope.newListHref = appPaths.hrefFromPath(appPaths.newListPath());
	});
