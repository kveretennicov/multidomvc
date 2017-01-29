(function () {
	'use strict';

	describe('Main Controller', function () {
		var ctrl, scope, store;

		beforeEach(module('todomvc'));

		beforeEach(inject(function ($controller, $rootScope) {
			scope = $rootScope.$new();
			store = {};
			ctrl = $controller('MainCtrl', {
				$scope: scope,
				store : store
			});
		}));

		it('sets ".store" on $scope', function () {
			expect(scope.store).toBe(store);
		});
	});
}());
