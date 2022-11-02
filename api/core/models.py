import uuid
from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.dispatch import receiver
from .choices import Tools


class Room(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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

    def __unicode__(self):
        return self.id


@receiver(models.signals.post_save, sender=Room)
def setup_room(sender, instance, created, **kwargs):
    if not created:
        return

    room = instance
    bookshelf = Bookshelf.objects.create(owner=room.owner, room=room)
    bookshelf.save()


class Bookshelf(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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

    def __unicode__(self):
        return self.id


@receiver(models.signals.post_save, sender=Bookshelf)
def setup_bookshelf(sender, instance, created, **kwargs):
    if not created:
        return

    bookshelf = instance
    room = bookshelf.room
    room.bookshelf_order.append(bookshelf.id)
    room.save()

    num_bookshelves = len(room.bookshelf_order)
    if (num_bookshelves == 1):
        notebook = Notebook.objects.create(
            owner=bookshelf.owner,
            bookshelf=bookshelf,
            title='Untitled'
        )
        notebook.save()


class Notebook(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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

    def __unicode__(self):
        return self.title


@receiver(models.signals.post_save, sender=Notebook)
def setup_notebook(sender, instance, created, **kwargs):
    if not created:
        return

    notebook = instance
    bookshelf = notebook.bookshelf
    bookshelf.notebook_order.append(notebook.id)
    bookshelf.save()

    page = Page.objects.create(
        owner=notebook.owner,
        notebook=notebook,
    )
    page.save()


class Page(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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

    color = models.CharField(
        max_length=255,
        default=None,
        blank=True,
        null=True
    )
    pattern_style = models.CharField(
        max_length=255,
        default=None,
        blank=True,
        null=True
    )
    pattern_color = models.CharField(
        max_length=255,
        default=None,
        blank=True,
        null=True
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

    def __unicode__(self):
        return f"{self.owner}'s page {self.id}"


@receiver(models.signals.post_save, sender=Page)
def setup_page(sender, instance, created, **kwargs):
    if not created:
        return

    page = instance
    notebook = page.notebook
    notebook.page_order.append(page.id)
    notebook.save()


class Element(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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
        default=None,
        null=True,
        blank=True
    )
    fill_color = models.CharField(
        max_length=32,
        default=None,
        null=True,
        blank=True
    )
    stroke_color = models.CharField(
        max_length=32,
        default=None,
        null=True,
        blank=True
    )
    size = models.FloatField(
        default=None,
        null=True,
        blank=True
    )
    is_ruler_line = models.BooleanField(
        default=False
    )
    points = ArrayField(
        models.JSONField(),
        default=list,
        blank=True
    )

    options = models.JSONField(
        default=None,
        null=True,
        blank=True
    )

    def __unicode__(self):
        return f'{self.id}-tool:{self.tool}'
