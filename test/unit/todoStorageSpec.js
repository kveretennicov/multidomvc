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

	describe('To Do Storage Service', function () {
		var store;

		beforeEach(module('todomvc', function ($provide) {
			// Give each test its own localStorage.
			$provide.value('localStorage', fakeLocalStorage());
		}));

		beforeEach(inject(function (clientBackedTodoStorage) {
			store = clientBackedTodoStorage;
		}));

		it('has "default" list by default', function () {
			expect(store.lists).toBeTruthy();
			var listNames = Object.keys(store.lists);
			expect(listNames).toEqual(['default']);
			expect(store.lists['default'].name).toEqual('default');
		});

		describe('having some non-default To Do lists', function () {

			beforeEach(function () {
				store.insert({name: 'eggs'});
				store.insert({name: 'spam'});
				store.insert({name: 'bacon'});
			});

			it('can get all lists', function () {
				var listNames = Object.keys(store.lists);
				expect(listNames).toContain('default');
				expect(listNames).toContain('bacon');
				expect(listNames).toContain('eggs');
				expect(listNames).toContain('spam');
				expect(listNames.length).toBe(4);
			});

			it('can delete current list with items', function () {
				var todoStore = store.lists['spam'];
				// Not waiting for promise resolution, as with
				// clientBackedTodoStorage these promises are fake-async.
				todoStore.insert({title: 'Spam!', completed: false});
				store.delete({name: 'spam'});
				expect(Object.keys(store.lists)).not.toContain('spam');
				todoStore.get();
				expect(todoStore.todos).toEqual([]);
			});
		});
	});
}());
