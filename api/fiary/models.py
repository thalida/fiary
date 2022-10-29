from email.policy import default
import uuid
from django.db import models
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
    bookshelf_order = models.ArrayField(
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
        related_name='rooms',
        on_delete=models.CASCADE
    )
    room = models.ForeignKey(
        Room,
        related_name='bookshelves',
        on_delete=models.CASCADE
    )
    notebook_order = models.ArrayField(
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
        related_name='rooms',
        on_delete=models.CASCADE
    )
    bookshelf = models.ForeignKey(
        Bookshelf,
        related_name='notebooks',
        on_delete=models.CASCADE
    )
    page_order = models.ArrayField(
        models.UUIDField(),
        default=list,
        blank=True
    )

    title = models.CharField(max_length=255)

    def __unicode__(self):
        return self.title


class Page(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    owner = models.ForeignKey(
        User,
        related_name='rooms',
        on_delete=models.CASCADE
    )
    notebook = models.ForeignKey(
        Notebook,
        related_name='pages',
        on_delete=models.CASCADE
    )

    def __unicode__(self):
        return f"{self.owner}'s page {self.id}"


class PageElement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    owner = models.ForeignKey(
        User,
        related_name='rooms',
        on_delete=models.CASCADE
    )
    notebook = models.ForeignKey(
        Notebook,
        related_name='pages',
        on_delete=models.CASCADE
    )

    tool = models.IntegerField(
        choices=Tools.choices,
        default=None,
        null=True,
        blank=True
    )
    composition = models.CharField(
        max_length=255,
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
    opacity = models.FloatField(
        default=None,
        null=True,
        blank=True
    )
    size = models.FloatField(
        default=None,
        null=True,
        blank=True
    )
    isRulerLine = models.BooleanField(
        default=False
    )
    points = models.JSONField(
        default=None,
        null=True,
        blank=True
    )
    options = models.JSONField(
        default=None,
        null=True,
        blank=True
    )
    freehandOptions = models.JSONField(
        default=None,
        null=True,
        blank=True
    )

    def __unicode__(self):
        return f'{self.id}-tool:{self.tool}'
