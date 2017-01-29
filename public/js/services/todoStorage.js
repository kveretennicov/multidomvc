/*global angular */

/**
 * Services that persists and retrieves todos from localStorage or a backend API
 * if available.
 *
 * They both follow the same API, returning promises for all changes to the
 * model.
 */
angular.module('todomvc')
	.factory('todoStorage', function ($http, $injector) {
		'use strict';

		// Detect if an API backend is present. If so, return the API module, else
		// hand off the localStorage adapter
		return $http.get('/api')
			.then(function () {
				return $injector.get('apiBackedTodoStorage');
			}, function () {
				return $injector.get('clientBackedTodoStorage');
			});
	})

	.factory('apiBackedTodoStorage', function ($resource) {
		'use strict';

		// TODO: update to support multiple lists
		var store = {
			todos: [],

			api: $resource('/api/todos/:id', null,
				{
					update: { method:'PUT' }
				}
			),

			clearCompleted: function () {
				var originalTodos = store.todos.slice(0);

				var incompleteTodos = store.todos.filter(function (todo) {
					return !todo.completed;
				});

				angular.copy(incompleteTodos, store.todos);

				return store.api.delete(function () {
					}, function error() {
						angular.copy(originalTodos, store.todos);
					});
			},

			delete: function (todo) {
				var originalTodos = store.todos.slice(0);

				store.todos.splice(store.todos.indexOf(todo), 1);
				return store.api.delete({ id: todo.id },
					function () {
					}, function error() {
						angular.copy(originalTodos, store.todos);
					});
			},

			get: function () {
				return store.api.query(function (resp) {
					angular.copy(resp, store.todos);
				});
			},

			insert: function (todo) {
				var originalTodos = store.todos.slice(0);

				return store.api.save(todo,
					function success(resp) {
						todo.id = resp.id;
						store.todos.push(todo);
					}, function error() {
						angular.copy(originalTodos, store.todos);
					})
					.$promise;
			},

			put: function (todo) {
				return store.api.update({ id: todo.id }, todo)
					.$promise;
			}
		};

		return store;
	})

	// Make localStorage injectable, for testability.
	.factory('localStorage', function ($window) {
		return $window.localStorage;
	})

	.factory('clientBackedTodoStorage', function ($q, localStorage) {
		'use strict';

		var STORAGE_ID_PREFIX = 'todos-angularjs';

		var newListStore = function (listName) {
			var STORAGE_ID = STORAGE_ID_PREFIX + '/lists/' + listName;
			var store = {
				name: listName,
				todos: [],

				_getFromLocalStorage: function () {
					return JSON.parse(localStorage.getItem(STORAGE_ID) || '[]');
				},

				_saveToLocalStorage: function (todos) {
					localStorage.setItem(STORAGE_ID, JSON.stringify(todos));
				},

				_purge: function () {
					var deferred = $q.defer();

					store.todos.length = 0;

					localStorage.removeItem(STORAGE_ID);
					deferred.resolve(store.todos);

					return deferred.promise;
				},

				clearCompleted: function () {
					var deferred = $q.defer();

					var incompleteTodos = store.todos.filter(function (todo) {
						return !todo.completed;
					});

					angular.copy(incompleteTodos, store.todos);

					store._saveToLocalStorage(store.todos);
					deferred.resolve(store.todos);

					return deferred.promise;
				},

				delete: function (todo) {
					var deferred = $q.defer();

					store.todos.splice(store.todos.indexOf(todo), 1);

					store._saveToLocalStorage(store.todos);
					deferred.resolve(store.todos);

					return deferred.promise;
				},

				get: function () {
					var deferred = $q.defer();

					angular.copy(store._getFromLocalStorage(), store.todos);
					deferred.resolve(store.todos);

					return deferred.promise;
				},

				insert: function (todo) {
					var deferred = $q.defer();

					store.todos.push(todo);

					store._saveToLocalStorage(store.todos);
					deferred.resolve(store.todos);

					return deferred.promise;
				},

				put: function (todo, index) {
					var deferred = $q.defer();

					store.todos[index] = todo;

					store._saveToLocalStorage(store.todos);
					deferred.resolve(store.todos);

					return deferred.promise;
				}
			};

			return store;
		};

		var LIST_NAMES_STORAGE_ID = STORAGE_ID_PREFIX + '/list-names';
		var mainStore = {
			lists: {}, // Map of list-name->list-store.

			_getListNamesFromLocalStorage: function () {
				var formattedListNames = localStorage.getItem(LIST_NAMES_STORAGE_ID);
				var listNames = JSON.parse(formattedListNames || '[]');
				if (listNames.indexOf('default') === -1) {
					listNames.push('default');
				}
				return listNames;
			},

			_saveListNamesToLocalStorage: function () {
				var listNames = [];
				angular.forEach(mainStore.lists, function (value, key) {
					listNames.push(key);
				});
				var formattedListNames = JSON.stringify(listNames);
				localStorage.setItem(LIST_NAMES_STORAGE_ID, formattedListNames);
			},

			delete: function (list) {
				var deferred = $q.defer();

				if (list.name === 'default') {
					deferred.reject('default list must not be deleted');
				}
				else {
					var subStore = mainStore.lists[list.name];
					if (subStore) {
						delete mainStore.lists[list.name];
						mainStore._saveListNamesToLocalStorage();
						subStore._purge();
					}
					deferred.resolve(mainStore.lists);
				}

				return deferred.promise;
			},

			get: function () {
				var deferred = $q.defer();

				// Data should be loaded from storage already; this is done
				// before mainStore instance is returned to clients, so normally
				// before any calls to get().
				deferred.resolve(mainStore.lists);

				return deferred.promise;
			},

			insert: function (list) {
				var deferred = $q.defer();

				var listName = list.name.trim();
				if (!listName) {
					deferred.reject('list name must not be blank or empty');
				}
				else if (listName in mainStore.lists) {
					deferred.reject('list "' + listName + '" already exists');
				}
				else {
					mainStore.lists[listName] = newListStore(listName);
					mainStore._saveListNamesToLocalStorage();
					deferred.resolve(mainStore.lists);
				}

				return deferred.promise;
			},
		};

		// Find all lists and create a substore object for each.
		var listNames = mainStore._getListNamesFromLocalStorage();
		angular.forEach(listNames, function (listName) {
			var subStore = newListStore(listName);
			subStore.get();
			mainStore.lists[listName] = subStore;
		});

		return mainStore;
	});
