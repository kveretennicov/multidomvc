from django.contrib import admin
from reversion.admin import VersionAdmin

from . import models


class ToDoItemInline(admin.TabularInline):
    model = models.ToDoItem


class ToDoListAdmin(VersionAdmin):
    inlines = [ToDoItemInline]


class ToDoItemAdmin(VersionAdmin):
    model = models.ToDoItem


admin.site.register(models.ToDoList, ToDoListAdmin)
admin.site.register(models.ToDoItem, ToDoItemAdmin)
