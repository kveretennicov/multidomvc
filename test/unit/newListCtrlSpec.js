(function () {
	'use strict';

	var fakeLocalStorage = function () {
		var storage = {};

		return {
			setItem: function(key, value) {
				storage[key] = value || '';
			},
			getItem: function(key) {
				return storage[key] || null;
			},
			removeItem: function(key) {
				delete storage[key];
			},
			get length() {
				return Object.keys(storage).length;
			},
			key: function(i) {
				var keys = Object.keys(storage);
				return keys[i] || null;
			}
		};
	};

	describe('New List Controller', function () {
		var ctrl, scope, store;

		beforeEach(module('todomvc', function ($provide) {
			// Give each test its own localStorage.
			$provide.value('localStorage', fakeLocalStorage());
			$provide.factory('store', function (clientBackedTodoStorage) {
				return clientBackedTodoStorage;
			});
		}));

		beforeEach(inject(function ($controller, $rootScope, clientBackedTodoStorage) {
			scope = $rootScope.$new();
			store = clientBackedTodoStorage;

			ctrl = $controller('NewListCtrl', {
				$scope: scope
			});
		}));

		describe('having some non-default To Do lists', function () {

			beforeEach(inject(function ($controller) {
				var ctrl = $controller('NewListCtrl', {
					$scope: scope,
				});

				store.insert({name: 'eggs'});
				store.insert({name: 'spam'});
				store.insert({name: 'bacon'});
			}));

			it('can create new list', function () {
				var listNames = Object.keys(store.lists);
				expect(listNames).toContain('default');
				expect(listNames).toContain('bacon');
				expect(listNames).toContain('eggs');
				expect(listNames).toContain('spam');
				expect(listNames.length).toBe(4);

				scope.newListName = 'ham';
				scope.createList();

				listNames = Object.keys(store.lists)
				expect(listNames).toContain('ham');
				expect(listNames.length).toBe(5);
			});

			it('warns of duplicated list name', function () {
				expect(scope.newListNameExists()).toBe(false);

				scope.newListName = 'spa';
				expect(scope.newListNameExists()).toBe(false);

				scope.newListName = 'spam';
				expect(scope.newListNameExists()).toBe(true);
			});

			it('cannot create list with duplicated name', function () {
				var spamTodoStore = store.lists['spam'];
				spamTodoStore.insert({title: 'spam #1', completed: false});
				expect(scope.newListNameExists()).toBe(false);

				scope.newListName = 'spam';
				scope.createList();

				expect(Object.keys(store.lists).length).toBe(4);
				expect(store.lists['spam'].todos.length).toBe(1);
				expect(store.lists['spam']).toBe(spamTodoStore);
			});
		});
	});
}());
