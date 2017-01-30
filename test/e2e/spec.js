describe('todo list', function() {

	beforeEach(function () {
		browser.get('http://localhost:8000/static/index.html');
	});

	it('does not smoke', function() {
		expect(browser.getTitle()).toEqual('AngularJS • TodoMVC');
	});

	it('shows "default" list by default', function() {
		var listName = element(by.id('todolists-dropdown')).$('option:checked').getText();
		expect(listName).toEqual('default');
	});

	it('shows remaining count', function() {
		var remainingCountText = element(by.id('todo-count')).getText();
		expect(remainingCountText).not.toContain('{{'); // TODO: strengthen
	});

	it('can add and remove a list', function() {

		var listOptions = function () {
			return element.all(by.options('list.name for list in lists track by list.name'));
		};

		var listCount = function () {
			return listOptions().count();
		};

		var currentListName = function () {
			return element(by.id('todolists-dropdown')).$('option:checked').getText();
		};

		var originalListCountPromise = listCount().then(function (originalListCount) {

			element(by.id('new-list-button')).click();
			var newListName = 'new spam list';
			var input = element(by.model('newListName'));
			input.sendKeys(newListName);
			input.sendKeys(protractor.Key.ENTER);

			expect(currentListName()).toEqual(newListName);
			expect(listCount()).toEqual(originalListCount + 1);

			element(by.id('delete-list-button')).click();

			expect(currentListName()).toEqual('default');
			expect(listCount()).toEqual(originalListCount);

			return originalListCount;
		});
		expect(originalListCountPromise).toBeGreaterThan(0);
	});

	var todoRepeaterExpr = 'todo in todos | filter:statusFilter track by $index';

	var todoItems = function () {
		return element.all(by.repeater(todoRepeaterExpr));
	};

	it('can add and remove todo items', function () {

		var firstTodoItem = function () {
			return element(by.repeater(todoRepeaterExpr).row(0));
		};

		var todoCount = function () {
			return todoItems().count();
		};

		var originalToDoCountPromise = todoCount().then(function (originalToDoCount) {

			var newItem = 'new spam todo';
			var input = element(by.model('newTodo'));
			input.sendKeys(newItem);
			input.sendKeys(protractor.Key.ENTER);

			expect(todoCount()).toEqual(originalToDoCount + 1);
			expect(firstTodoItem().getText()).toEqual(newItem);

			// Invisible elements have their peculiarities.
			var visibleOnHoverContainer = element(by.repeater(todoRepeaterExpr).row(0));
			var visibleOnHoverButton = visibleOnHoverContainer.$('button.destroy');
			browser.actions().mouseMove(visibleOnHoverContainer).perform();
			visibleOnHoverButton.click();

			expect(todoCount()).toEqual(originalToDoCount);

			return originalToDoCount;
		});
		expect(originalToDoCountPromise).toBeGreaterThan(-1);
	});

	it('can complete and clear items', function () {

		var clearCompletedButton = element(by.id('clear-completed'));
		var toggleAllButton = element(by.id('toggle-all'));

		var newItemA = 'spam A';
		var newItemB = 'spam B';
		var newItemC = 'spam C';
		var input = element(by.model('newTodo'));
		input.sendKeys(newItemA);
		input.sendKeys(protractor.Key.ENTER);
		input.sendKeys(newItemB);
		input.sendKeys(protractor.Key.ENTER);
		input.sendKeys(newItemC);
		input.sendKeys(protractor.Key.ENTER);

		expect(todoItems().count()).toBe(3);
		expect(todoItems().all(by.css('input.toggle')).count()).toBe(3);
		expect(todoItems().all(by.css('input.toggle:checked')).count()).toBe(0);

		expect(clearCompletedButton.isDisplayed()).toBe(false);

		var checkboxB = element(by.repeater(todoRepeaterExpr).row(1))
						.$('input.toggle');
		checkboxB.click();
		expect(todoItems().all(by.css('input.toggle')).count()).toBe(3);
		expect(todoItems().all(by.css('input.toggle:checked')).count()).toBe(1);

		clearCompletedButton.click(); // Expect B to be removed.
		expect(todoItems().all(by.css('input.toggle')).count()).toBe(2);
		expect(todoItems().all(by.css('input.toggle:checked')).count()).toBe(0);
		expect(todoItems().count()).toBe(2);
		expect(element(by.repeater(todoRepeaterExpr).row(0)).getText()).toBe(newItemC);
		expect(element(by.repeater(todoRepeaterExpr).row(1)).getText()).toBe(newItemA);

		toggleAllButton.click();
		expect(todoItems().all(by.css('input.toggle')).count()).toBe(2);
		expect(todoItems().all(by.css('input.toggle:checked')).count()).toBe(2);

		clearCompletedButton.click(); // Expect A and C to be removed.
		expect(todoItems().count()).toBe(0);
	});

	// TODO: can edit item title
});
