from django.contrib import admin

from .models import Palette, PaletteCollection, PaletteSwatch, Room, Bookshelf, Notebook, Page, Element

admin.site.register(Room)
admin.site.register(Bookshelf)
admin.site.register(Page)
admin.site.register(Element)
admin.site.register(PaletteCollection)


@admin.register(Notebook)
class NotebookAdmin(admin.ModelAdmin):
    list_display = ('title', 'uid', 'owner', 'bookshelf',
                    'created_at', 'updated_at')
    list_filter = ('owner', 'bookshelf')


@admin.register(Palette)
class PaletteAdmin(admin.ModelAdmin):
    list_display = ('title', 'uid', 'palette_type', 'created_at', 'updated_at')
    list_filter = ('owner', 'palette_type')


@admin.register(PaletteSwatch)
class PaletteSwatchAdmin(admin.ModelAdmin):
    list_display = ('uid', 'palette_title', 'is_default', 'created_at', 'updated_at')
    list_filter = ('palette',)

    def palette_title(self, obj):
        return obj.palette.title
