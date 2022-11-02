from django.contrib import admin

from .models import Room, Bookshelf, Notebook, Page, Element

admin.site.register(Room)
admin.site.register(Bookshelf)
admin.site.register(Notebook)
admin.site.register(Page)
admin.site.register(Element)
