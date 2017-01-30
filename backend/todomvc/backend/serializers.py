from rest_framework import serializers
from . import models


class ToDoItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ToDoItem
        fields = ('title', 'completed')


# For "listing" serialization.
class ToDoListBriefSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.ToDoList
        fields = ('url', 'name')

# For "detailed" serialization.
class ToDoListDetailedSerializer(serializers.HyperlinkedModelSerializer):
    todos = ToDoItemSerializer(many=True) # Using nested representation.

    class Meta:
        model = models.ToDoList
        fields = ('url', 'name', 'todos')

    def create(self, validated_data):
        todos = validated_data.pop('todos')
        new_list = models.ToDoList.objects.create(**validated_data)
        for todo in todos:
            new_list.todos.create(**todo)
        return new_list

    def update(self, instance, validated_data):
        todos = validated_data.pop('todos')
        instance = super(ToDoListDetailedSerializer, self).update(instance, validated_data)
        # TODO: can use a more intelligent patching, esp. if lists are large enough
        instance.todos.all().delete()
        for todo in todos:
            instance.todos.create(**todo)
        instance.save()
        return instance
