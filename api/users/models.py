import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.dispatch import receiver
from core.choices import PaletteTypes

from core.models import Bookshelf, Notebook, Page, PaletteCollection, Room


class User(AbstractUser):
    uid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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
    room.save()

    paletteCollection = PaletteCollection.objects.create(owner=instance)
    paletteCollection.save()

    palette = paletteCollection.palettes.create(
        title="Default",
        palette_type=PaletteTypes.GENERAL,
        owner=instance
    )
    palette.save()

    default_swatches = [
        {"r": 255, "g": 0, "b": 0, "a": 1},
        {"a": 1, "b": 0, "g": 136, "r": 255},
        {"a": 1, "b": 0, "g": 221, "r": 255},
        {"a": 1, "b": 0, "g": 255, "r": 115},
        {"a": 1, "b": 255, "g": 145, "r": 0},
        {"a": 1, "b": 255, "g": 0, "r": 60},
        {"a": 1, "b": 255, "g": 0, "r": 191},
        {"a": 1, "b": 255, "g": 0, "r": 242},
        [
            {"color": {"a": 1, "b": 255, "g": 47, "r": 0}, "percent": 1.4492753623188406},
            {"color": {"a": 1, "b": 234, "g": 0, "r": 255}, "percent": 97.58454106280193}
        ],
    ]
    for swatch in default_swatches:
        swatch = palette.swatches.create(
            owner=instance,
            swatch=swatch
        )
        swatch.save()
