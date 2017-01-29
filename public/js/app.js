/*global angular */

/**
 * The main TodoMVC app module
 *
 * @type {angular.Module}
 */
angular.module('todomvc', ['ngRoute', 'ngResource'])
	.config(function ($routeProvider, $provide, $locationProvider) {
		'use strict';

		var resolverConfig = {
			store: function (todoStorage) {
				// Get the correct module (API or localStorage).
				return todoStorage.then(function (module) {
					module.get(); // Fetch the todo records in the background.
					return module;
				});
			}
		};

		var viewTodoListRoute = {
			controller: 'MainCtrl',
			templateUrl: 'todomvc-view-list.html',
			resolve: resolverConfig,
		};
		var newTodoListRoute = {
			controller: 'NewListCtrl',
			templateUrl: 'todomvc-new-list.html',
			resolve: resolverConfig,
		};

		var appPaths = {
			defaultListPath: function (statusFilter) {
				var path = '/lists/default';
				if (statusFilter) {
					path += '/' + statusFilter;
				}
				return path;
			},
			listPath: function (listName, statusFilter) {
				if (listName === 'default')
				{
					return appPaths.defaultListPath(statusFilter);
				}
				var path = '/lists/name=' + encodeURIComponent(listName);
				if (statusFilter) {
					path += '/' + statusFilter;
				}
				return path;
			},
			newListPath: function () {
				return '/lists/new';
			},
			hrefFromPath: function (path) {
				return '#' + $locationProvider.hashPrefix() + path;
			},
			getListName: function (routeParams) {
				return decodeURIComponent(routeParams.listName || 'default');
			},
		};

		$routeProvider
			.when('/lists/name=:listName/:status?', viewTodoListRoute)
			.when('/lists/default/:status?', viewTodoListRoute)
			.when('/lists/new', newTodoListRoute)
			.otherwise({
				redirectTo: appPaths.defaultListPath()
			});

		$provide.value('appPaths', appPaths);
	});
