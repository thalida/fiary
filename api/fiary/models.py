import uuid
from django.db import models
from django.contrib.postgres.fields import ArrayField
from fiary.choices import Tools
from users.models import User


class Room(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    owner = models.ForeignKey(
        User,
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


class Bookshelf(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    owner = models.ForeignKey(
        User,
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


class Notebook(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    owner = models.ForeignKey(
        User,
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


class Page(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    owner = models.ForeignKey(
        User,
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


class Element(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    owner = models.ForeignKey(
        User,
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
