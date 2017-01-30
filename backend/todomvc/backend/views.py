from rest_framework import viewsets
from . import models, serializers


class ToDoListViewSet(viewsets.ModelViewSet):
    """API endpoint that allows To Do Lists to be viewed or edited.
    """
    queryset = models.ToDoList.objects.all().order_by('name')

    def get_serializer_class(self):
        # Use different serializer for the listing.
        if self.action == 'list':
            return serializers.ToDoListBriefSerializer
        return serializers.ToDoListDetailedSerializer
