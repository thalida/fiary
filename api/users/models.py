import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.dispatch import receiver

from core.models import Bookshelf, Notebook, Page, Room


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(
        blank=False,
        max_length=254,
        verbose_name="email address"
    )

    USERNAME_FIELD = "username"
    EMAIL_FIELD = "email"


@receiver(models.signals.post_save, sender=User)
def save_from_user(sender, instance, created, **kwargs):
    if not created:
        return

    room = Room.objects.create(owner=instance)
    bookshelf = Bookshelf.objects.create(owner=instance, room=room)
    notebook = Notebook.objects.create(
        owner=instance,
        bookshelf=bookshelf,
        title='Default'
    )
    page = Page.objects.create(owner=instance, notebook=notebook)

    room.bookshelf_order = [bookshelf.id]
    room.save()

    bookshelf.notebook_order = [notebook.id]
    bookshelf.save()

    notebook.page_order = [page.id]
    notebook.save()
