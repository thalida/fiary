from django.contrib import admin

from .models import Room, Bookshelf, Notebook, Page, Element

admin.site.register(Room)
admin.site.register(Bookshelf)
admin.site.register(Page)
admin.site.register(Element)


@admin.register(Notebook)
class NotebookAdmin(admin.ModelAdmin):
    list_display = ('title', 'id', 'owner', 'bookshelf',
                    'created_at', 'updated_at')
    list_filter = ('owner', 'bookshelf')
