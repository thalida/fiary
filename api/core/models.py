import uuid
from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.dispatch import receiver
from .choices import PaletteTypes, PatternTypes, SwatchDefaultUsages, Tools


class Room(models.Model):
    uid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    owner = models.ForeignKey(
        'users.User',
        related_name='rooms',
        on_delete=models.CASCADE
    )
    bookshelf_order = ArrayField(
        models.UUIDField(),
        default=list,
        blank=True
    )

    def __str__(self):
        return f'{self.owner.username}\'s Room'


@receiver(models.signals.post_save, sender=Room)
def setup_room(sender, instance, created, **kwargs):
    if not created:
        return

    room = instance
    bookshelf = Bookshelf.objects.create(owner=room.owner, room=room)
    bookshelf.save()


class Bookshelf(models.Model):
    uid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    owner = models.ForeignKey(
        'users.User',
        related_name='bookshelves',
        on_delete=models.CASCADE
    )
    room = models.ForeignKey(
        Room,
        related_name='bookshelves',
        on_delete=models.CASCADE
    )
    notebook_order = ArrayField(
        models.UUIDField(),
        default=list,
        blank=True
    )

    def __str__(self):
        return f'{self.owner.username}\'s Bookshelf'


@receiver(models.signals.post_save, sender=Bookshelf)
def setup_bookshelf(sender, instance, created, **kwargs):
    if not created:
        return

    bookshelf = instance
    room = bookshelf.room
    room.bookshelf_order.append(bookshelf.uid)
    room.save()


class Notebook(models.Model):
    uid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    owner = models.ForeignKey(
        'users.User',
        related_name='notebooks',
        on_delete=models.CASCADE
    )
    bookshelf = models.ForeignKey(
        Bookshelf,
        related_name='notebooks',
        on_delete=models.CASCADE
    )
    page_order = ArrayField(
        models.UUIDField(),
        default=list,
        blank=True
    )

    title = models.CharField(
        max_length=255,
        default=None,
        blank=True,
        null=True
    )

    def __str__(self):
        return self.title


@receiver(models.signals.post_save, sender=Notebook)
def setup_notebook(sender, instance, created, **kwargs):
    if not created:
        return

    notebook = instance
    bookshelf = notebook.bookshelf
    bookshelf.notebook_order.append(notebook.uid)
    bookshelf.save()


class Page(models.Model):
    uid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    owner = models.ForeignKey(
        'users.User',
        related_name='pages',
        on_delete=models.CASCADE
    )
    notebook = models.ForeignKey(
        Notebook,
        related_name='pages',
        on_delete=models.CASCADE
    )
    paper_swatch = models.ForeignKey(
        'core.PaletteSwatch',
        related_name='paper_swatch',
        on_delete=models.SET_NULL,
        default=None,
        blank=True,
        null=True
    )
    pattern_swatch = models.ForeignKey(
        'core.PaletteSwatch',
        related_name='pattern_swatch',
        on_delete=models.SET_NULL,
        default=None,
        blank=True,
        null=True
    )
    pattern_type = models.IntegerField(
        choices=PatternTypes.choices,
        default=PatternTypes.SOLID
    )
    pattern_size = models.FloatField(
        default=None,
        blank=True,
        null=True
    )
    pattern_spacing = models.FloatField(
        default=None,
        blank=True,
        null=True
    )
    pattern_opacity = models.IntegerField(
        default=None,
        blank=True,
        null=True
    )
    element_order = ArrayField(
        models.UUIDField(),
        default=list,
        blank=True
    )

    def __str__(self):
        return f"{self.owner.username}'s page {self.uid}"


@receiver(models.signals.post_save, sender=Page)
def setup_page(sender, instance, created, **kwargs):
    if not created:
        return

    page = instance
    notebook = page.notebook
    notebook.page_order.append(page.uid)
    notebook.save()


class Element(models.Model):
    uid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    owner = models.ForeignKey(
        'users.User',
        related_name='elements',
        on_delete=models.CASCADE
    )
    page = models.ForeignKey(
        Page,
        related_name='elements',
        on_delete=models.CASCADE
    )
    tool = models.IntegerField(
        choices=Tools.choices,
    )
    points = models.JSONField()
    settings = models.JSONField(
        default=None,
        null=True,
        blank=True
    )
    transform = models.JSONField(
        default=None,
        null=True,
        blank=True
    )
    dimensions = models.JSONField(
        default=None,
        null=True,
        blank=True
    )
    canvas_settings = models.JSONField(
        default=None,
        null=True,
        blank=True
    )
    image_render = models.TextField(
        default=None,
        null=True,
        blank=True
    )
    is_cached = models.BooleanField(
        default=False
    )
    is_html_element = models.BooleanField(
        default=False
    )
    is_hidden = models.BooleanField(
        default=False
    )

    def __str__(self):
        return f'{self.uid}-tool:{self.tool}'



@receiver(models.signals.post_save, sender=Element)
def setup_element(sender, instance, created, **kwargs):
    if not created:
        return

    element = instance
    page = element.page
    page.element_order.append(element.uid)
    page.save()


class PaletteCollection(models.Model):
    uid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    owner = models.OneToOneField(
        'users.User',
        related_name='palette_collection',
        on_delete=models.CASCADE
    )

    palette_order = ArrayField(
        models.UUIDField(),
        default=list,
        blank=True
    )

    def __str__(self):
        return f"{self.owner.username}'s collection - {self.uid}"


class Palette(models.Model):
    uid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    owner = models.ForeignKey(
        'users.User',
        related_name='palettes',
        on_delete=models.CASCADE
    )

    collections = models.ManyToManyField(
        PaletteCollection,
        related_name='palettes',
        blank=True
    )

    title = models.CharField(
        max_length=255,
        default=None,
        blank=True,
        null=True
    )

    is_public = models.BooleanField(
        default=False
    )

    palette_type = models.IntegerField(
        choices=PaletteTypes.choices,
        default=PaletteTypes.GENERAL
    )

    def __str__(self):
        return f'{self.title}'


@receiver(models.signals.post_save, sender=Palette)
def setup_palette(sender, instance, created, **kwargs):
    palette = instance

    for collection in palette.collections.all():
        if palette.uid not in collection.palette_order:
            collection.palette_order.append(palette.uid)
            collection.save()

@receiver(models.signals.post_delete, sender=Palette)
def teardown_palette(sender, instance, **kwargs):
    palette = instance

    for collection in palette.collections.all():
        if palette.uid in collection.palette_order:
            collection.palette_order.remove(palette.uid)
            collection.save()


class PaletteSwatch(models.Model):
    uid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    owner = models.ForeignKey(
        'users.User',
        related_name='palette_swatches',
        on_delete=models.CASCADE
    )

    palette = models.ForeignKey(
        Palette,
        related_name='swatches',
        on_delete=models.CASCADE
    )

    swatch = models.JSONField(
        default=None,
    )

    is_default = models.BooleanField(
        default=False
    )

    def __str__(self):
        return f'{self.palette}-{self.swatch}'

    class Meta:
        ordering = ['created_at']
