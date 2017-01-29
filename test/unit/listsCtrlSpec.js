(function () {
	'use strict';

	var map = function map(a, f) {
		var result = [];
		angular.forEach(a, function (value) {
			var mappedValue = f(value);
			result.push(mappedValue);
		});
		return result;
	};

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

	describe('Lists Controller', function () {
		var ctrl, scope, store;

		beforeEach(module('todomvc', function ($provide) {
			// Give each test its own localStorage.
			$provide.value('localStorage', fakeLocalStorage());
		}));

		beforeEach(inject(function ($controller, $rootScope, clientBackedTodoStorage) {
			scope = $rootScope.$new();
			scope.store = store = clientBackedTodoStorage;

			ctrl = $controller('ListsCtrl', {
				$scope: scope
			});
		}));

		it('has "default" list name selected by default', function () {
			expect(scope.selectedList).toBeTruthy();
			expect(scope.selectedList.name).toEqual('default');
		});

		it('has only "default" list by default', function () {
			expect(scope.lists).toBeTruthy();
			var listNames = map(scope.lists, function (list) {
				return list.name;
			});
			expect(listNames).toEqual(['default']);
		});

		describe('having some non-default To Do lists', function () {

			beforeEach(inject(function ($controller) {
				var ctrl = $controller('ListsCtrl', {
					$scope: scope,
				});

				store.insert({name: 'eggs'});
				store.insert({name: 'spam'});
				store.insert({name: 'bacon'});
			}));

			it('shows all lists', function () {
				var listNames = map(scope.lists, function (list) {
					return list.name;
				});
				expect(listNames).toContain('default');
				expect(listNames).toContain('bacon');
				expect(listNames).toContain('eggs');
				expect(listNames).toContain('spam');
				expect(listNames.length).toBe(4);
			});

			describe('being at "spam" list', function () {

				beforeEach(inject(function ($controller) {
					ctrl = $controller('ListsCtrl', {
						$scope: scope,
						$routeParams: { listName: 'spam' }
					});
				}));

				it('has "spam" list name selected', function () {
					expect(scope.selectedList).toBeTruthy();
					expect(scope.selectedList.name).toEqual('spam');
					expect(Object.keys(scope.lists).length).toBe(4);
				});

				it('can delete current list', function () {
					expect(scope.selectedList).toBe(scope.lists['spam']);
					expect(Object.keys(scope.lists)).toContain('spam');
					expect(Object.keys(scope.lists).length).toBe(4);

					scope.deleteCurrentList();

					expect(Object.keys(scope.lists)).not.toContain('spam');
					expect(Object.keys(scope.lists).length).toBe(3);
				});
			});

			describe('being at "default" list', function () {

				beforeEach(inject(function ($controller) {
					ctrl = $controller('ListsCtrl', {
						$scope: scope,
						$routeParams: { listName: 'default' }
					});
				}));

				it('has "default" list name selected', function () {
					expect(scope.selectedList).toBeTruthy();
					expect(scope.selectedList.name).toEqual('default');
					expect(Object.keys(scope.lists).length).toBe(4);
				});

				it('cannot delete current list', function () {
					expect(scope.selectedList).toBe(scope.lists['default']);
					expect(Object.keys(scope.lists)).toContain('default');
					expect(Object.keys(scope.lists).length).toBe(4);

					scope.deleteCurrentList();

					expect(scope.selectedList).toBe(scope.lists['default']);
					expect(Object.keys(scope.lists)).toContain('default');
					expect(Object.keys(scope.lists).length).toBe(4);
				});
			});
		});
	});
}());
