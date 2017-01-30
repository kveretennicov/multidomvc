from django.contrib import admin

from . import models


class ToDoItemInline(admin.TabularInline):
    model = models.ToDoItem


class ToDoListAdmin(admin.ModelAdmin):
    inlines = [ToDoItemInline]


admin.site.register(models.ToDoList, ToDoListAdmin)
admin.site.register(models.ToDoItem)
