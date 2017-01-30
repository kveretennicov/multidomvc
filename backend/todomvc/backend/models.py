from django.db import models


class ToDoList(models.Model):
    name = models.CharField(max_length=256, unique=True, db_index=True) # Natural key.

    def __str__(self):
        return self.name


class ToDoItem(models.Model):
    title = models.CharField(max_length=256) # Allowing duplicates in the list.
    completed = models.BooleanField(default=False)
    parent_list = models.ForeignKey(ToDoList, on_delete=models.CASCADE,
                                    related_name='todos')

    class Meta:
        order_with_respect_to = 'parent_list'

    def __str__(self):
        return self.title
