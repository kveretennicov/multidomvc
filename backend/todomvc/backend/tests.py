from django.test import TestCase
from rest_framework.test import APITestCase
from . import models
import reversion
from reversion.models import Version


class TestsBase:
    fixtures = ['initial_data']


class DataTests(TestsBase, TestCase):

    def test__There_is_a_default_todo_list_in_fresh_database(self):
        self.assertQuerysetEqual(models.ToDoList.objects.all(),
                                 ['<ToDoList: default>'])
        self.assertQuerysetEqual(models.ToDoList.objects.get(name='default').todos.all(),
                                 [])

    def test__Can_create_a_todo_list(self):
        self.assertQuerysetEqual(models.ToDoList.objects.filter(name='spam'), [])
        new_list = models.ToDoList.objects.create(name='spam')
        self.assertQuerysetEqual(models.ToDoList.objects.filter(name='spam'),
                                 ['<ToDoList: spam>'])

    def test__Cannot_duplicate_a_todo_list_name(self):
        from django.db.utils import IntegrityError
        new_list = models.ToDoList.objects.create(name='spam')
        with self.assertRaises(IntegrityError) as c:
            models.ToDoList.objects.create(name='spam')

    def test__Can_add_and_remove_todo_items(self):
        new_list = models.ToDoList.objects.create(name='spam list')
        self.assertQuerysetEqual(new_list.todos.all(), [])
        new_list.todos.create(title='bacon item')
        new_list.todos.create(title='eggs item', completed=False)
        new_list.todos.create(title='eggs item', completed=True)
        self.assertQuerysetEqual(new_list.todos.all(),
                                 ['<ToDoItem: bacon item>', '<ToDoItem: eggs item>',
                                  '<ToDoItem: eggs item>',])
        new_list.todos.filter(title='eggs item').first().delete()
        self.assertQuerysetEqual(new_list.todos.all(),
                                 ['<ToDoItem: bacon item>', '<ToDoItem: eggs item>',])
        self.assertIs(new_list.todos.get(title='eggs item').completed, True)

    def xtest__Cannot_remove_default_todo_list(self):
        pass # TODO:


class ApiTests(TestsBase, APITestCase):

    def test__Can_request_api_root(self):
        response = self.client.get('/api', follow=True) # /api redirects to /api/
        self.assertIn('lists', response.json())

    def _get_lists_address(self):
        response = self.client.get('/api', follow=True)
        return response.json()['lists']

    def test__Can_navigate_to_named_list(self):
        # Prepare data.
        new_list = models.ToDoList.objects.create(name='spam list')
        new_list.todos.create(title='bacon item')
        new_list.todos.create(title='eggs item', completed=False)
        new_list.todos.create(title='eggs item', completed=True)
        # Navigate.
        lists_address = self._get_lists_address()
        response = self.client.get(lists_address)
        lists = response.json()
        self.assertEqual([x['name'] for x in lists], ['default', 'spam list'])
        list_details_address = lists[1]["url"]
        response = self.client.get(list_details_address)
        list_details = response.json()
        self.assertEqual(list_details["todos"],
                         [{'title': 'bacon item', 'completed': False},
                          {'title': 'eggs item', 'completed': False},
                          {'title': 'eggs item', 'completed': True},])

    def test__Can_create_a_new_empty_todo_list(self):
        lists_address = self._get_lists_address()
        response = self.client.post(lists_address, {'name': 'spam'})
        # Verify response.
        self.assertEqual(response.status_code, 201)
        new_list = response.json()
        self.assertEqual(new_list['name'], 'spam')
        self.assertEqual(new_list['todos'], [])
        # Verify data.
        new_list = models.ToDoList.objects.get(name='spam')
        self.assertEqual(new_list.name, 'spam')
        self.assertQuerysetEqual(new_list.todos.all(), [])

    def test__Can_create_a_new_todo_list_with_items(self):
        lists_address = self._get_lists_address()
        new_list_data = {'name': 'spam',
                         'todos': [{'title': 'bacon item', 'completed': False},
                                   {'title': 'eggs item', 'completed': False},
                                   {'title': 'eggs item', 'completed': True},]}
        response = self.client.post(lists_address, new_list_data, format='json')
        # Verify response.
        self.assertEqual(response.status_code, 201)
        new_list = response.json()
        self.assertEqual(new_list['name'], 'spam')
        self.assertEqual(new_list["todos"],
                         [{'title': 'bacon item', 'completed': False},
                          {'title': 'eggs item', 'completed': False},
                          {'title': 'eggs item', 'completed': True},])
        # Verify data.
        new_list = models.ToDoList.objects.get(name='spam')
        self.assertEqual(new_list.name, 'spam')
        self.assertQuerysetEqual(new_list.todos.all(),
                                 ['<ToDoItem: bacon item>',
                                  '<ToDoItem: eggs item>',
                                  '<ToDoItem: eggs item>',])

    def test__Can_add_and_remove_todo_items_in_existing_list(self):
        # Prepare data.
        new_list = models.ToDoList.objects.create(name='spam list')
        new_list.todos.create(title='bacon item')
        new_list.todos.create(title='eggs item', completed=False)
        new_list.todos.create(title='eggs item', completed=True)
        # Navigate to list.
        response = self.client.get(self._get_lists_address())
        matches = [a_list for a_list in response.json() if a_list['name'] == 'spam list']
        new_list_address = matches[0]["url"]
        # Update list.
        response = self.client.patch(new_list_address,
                                     {'todos': [ # Add.
                                                 {'title': 'ham item', 'completed': False},
                                                 # Complete.
                                                 {'title': 'bacon item', 'completed': True},
                                                 # Delete.
                                                 # {'title': 'eggs item', 'completed': False},
                                                 # Rename.
                                                 {'title': 'eggs item renamed', 'completed': True},]},
                                     format='json')
        # Verify response.
        self.assertEqual(response.status_code, 200)
        resp_list = response.json()
        self.assertEqual(resp_list['url'], new_list_address)
        self.assertEqual(resp_list['todos'],
                         [{'title': 'ham item', 'completed': False},
                          {'title': 'bacon item', 'completed': True},
                          {'title': 'eggs item renamed', 'completed': True}])
        # Verify data.
        self.assertQuerysetEqual(new_list.todos.all(),
                                 ['<ToDoItem: ham item>',
                                  '<ToDoItem: bacon item>',
                                  '<ToDoItem: eggs item renamed>',])
        self.assertIs(new_list.todos.get(title='bacon item').completed, True)
        self.assertIs(new_list.todos.get(title='eggs item renamed').completed, True)

    def test__Can_remove_todo_list_with_items(self):
        # Prepare data.
        new_list = models.ToDoList.objects.create(name='spam list')
        item_a = new_list.todos.create(title='bacon item')
        item_b = new_list.todos.create(title='eggs item', completed=False)
        # Navigate to list.
        response = self.client.get(self._get_lists_address())
        matches = [a_list for a_list in response.json() if a_list['name'] == 'spam list']
        new_list_address = matches[0]["url"]
        # Delete.
        response = self.client.delete(new_list_address)
        # Verify response.
        self.assertEqual(response.status_code, 204)
        # Verify data.
        self.assertQuerysetEqual(models.ToDoList.objects.filter(name='spam list'), [])
        self.assertQuerysetEqual(models.ToDoItem.objects.filter(title='bacon item'), [])


class RevisioningTests(TestsBase, APITestCase):

    def _get_lists_address(self):
        response = self.client.get('/api', follow=True)
        return response.json()['lists']

    def test__ToDoList_and_toDoItem_are_registered_for_revisioning(self):
        self.assertIn(models.ToDoList, reversion.get_registered_models())
        self.assertIn(models.ToDoItem, reversion.get_registered_models())

    def test__List_and_items_modifications_create_revisions(self):
        lists_address = self._get_lists_address()
        # Create new list with single item.
        spam_list_data_v1 = {'name': 'spam',
                             'todos': [{'title': 'bacon item', 'completed': False}]}
        response = self.client.post(lists_address, spam_list_data_v1,
                                    format='json')
        spam_list_address = response.json()['url']
        spam_list = models.ToDoList.objects.get(name='spam')
        bacon_item = spam_list.todos.get(title='bacon item')
        spam_list_versions = Version.objects.get_for_object(spam_list)
        bacon_item_versions = Version.objects.get_for_object(bacon_item)
        # There should be one initial version for both models.
        self.assertEqual(len(spam_list_versions), 1);
        self.assertEqual(len(bacon_item_versions), 1);
        # "Create"-related changes should belong to same revision.
        self.assertEqual(spam_list_versions[0].revision,
                         bacon_item_versions[0].revision);
        # Modify list.
        spam_list_data_v2 = {'todos': [{'title': 'eggs item', 'completed': False},
                                       {'title': 'bacon item', 'completed': True}]}
        self.client.patch(spam_list_address, spam_list_data_v2, format='json')
        spam_list_versions = Version.objects.get_for_object(spam_list)
        # There should be one more version for the list.
        self.assertEqual(len(spam_list_versions), 2);
        self.assertEqual(Version.objects.count(),
                         # Initial and mod for the list;
                         # one initial for each of 3 items;
                         # one mod for "bacon item".
                         (1 + 1) + 3 + 1)

    def test__Can_revert_modified_list_with_items(self):
        lists_address = self._get_lists_address()
        # Create new list with single item.
        spam_list_data_v1 = {'name': 'spam',
                             'todos': [{'title': 'bacon item', 'completed': False}]}
        response = self.client.post(lists_address, spam_list_data_v1,
                                    format='json')
        spam_list_address = response.json()['url']
        spam_list = models.ToDoList.objects.get(name='spam')
        # Modify list.
        spam_list_data_v2 = {'name':'spam v2',
                             'todos': [{'title': 'eggs item', 'completed': False},
                                       {'title': 'bacon item', 'completed': True}]}
        self.client.patch(spam_list_address, spam_list_data_v2, format='json')
        # Revert to initial version.
        spam_list.refresh_from_db()
        spam_list_versions = Version.objects.get_for_object(spam_list)
        initial_version = spam_list_versions.last()
        initial_version.revision.revert(delete=True)
        spam_list.refresh_from_db()
        self.assertEqual(spam_list.name, 'spam')
        self.assertQuerysetEqual(spam_list.todos.all(), ['<ToDoItem: bacon item>']);
        self.assertIs(spam_list.todos.get(title='bacon item').completed, False)

    def test__Can_revert_deleted_list_with_items(self):
        lists_address = self._get_lists_address()
        # Create new list with single item.
        spam_list_data_v1 = {'name': 'spam',
                             'todos': [{'title': 'bacon item', 'completed': False}]}
        response = self.client.post(lists_address, spam_list_data_v1,
                                    format='json')
        spam_list_address = response.json()['url']
        spam_list = models.ToDoList.objects.get(name='spam')
        spam_list_versions = Version.objects.get_for_object(spam_list)
        spam_list_original_pk = spam_list.pk
        bacon_item_original_pk = spam_list.todos.get(title='bacon item').pk
        # Delete the list.
        self.client.delete(spam_list_address)
        # Revert to initial version.
        initial_version = spam_list_versions.last()
        initial_version.revision.revert()
        spam_list = models.ToDoList.objects.get(name='spam')
        self.assertEqual(spam_list.pk, spam_list_original_pk)
        self.assertQuerysetEqual(spam_list.todos.all(), ['<ToDoItem: bacon item>'])
        self.assertEqual(spam_list.todos.get(title='bacon item').pk,
                         bacon_item_original_pk)
