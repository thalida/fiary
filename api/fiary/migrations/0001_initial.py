# Generated by Django 4.1.2 on 2022-10-29 19:58

from django.conf import settings
import django.contrib.postgres.fields
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Bookshelf",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "notebook_order",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.UUIDField(),
                        blank=True,
                        default=list,
                        size=None,
                    ),
                ),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="bookshelves",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Notebook",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "page_order",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.UUIDField(),
                        blank=True,
                        default=list,
                        size=None,
                    ),
                ),
                ("title", models.CharField(max_length=255)),
                (
                    "bookshelf",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notebooks",
                        to="fiary.bookshelf",
                    ),
                ),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notebooks",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Room",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "bookshelf_order",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.UUIDField(),
                        blank=True,
                        default=list,
                        size=None,
                    ),
                ),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="rooms",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Page",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "color",
                    models.CharField(
                        blank=True, default=None, max_length=255, null=True
                    ),
                ),
                (
                    "pattern_style",
                    models.CharField(
                        blank=True, default=None, max_length=255, null=True
                    ),
                ),
                (
                    "pattern_color",
                    models.CharField(
                        blank=True, default=None, max_length=255, null=True
                    ),
                ),
                (
                    "pattern_size",
                    models.FloatField(blank=True, default=None, null=True),
                ),
                (
                    "pattern_spacing",
                    models.FloatField(blank=True, default=None, null=True),
                ),
                (
                    "notebook",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="pages",
                        to="fiary.notebook",
                    ),
                ),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="pages",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Element",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "tool",
                    models.IntegerField(
                        blank=True,
                        choices=[
                            (1, "Eraser"),
                            (2, "Clear All"),
                            (10, "Pen"),
                            (11, "Marker"),
                            (12, "Highlighter"),
                            (20, "Blob"),
                            (30, "Circle"),
                            (31, "Rectangle"),
                            (32, "Triangle"),
                            (33, "Line"),
                            (40, "Cut"),
                            (41, "Paste"),
                            (50, "Image"),
                            (60, "Checkbox"),
                            (61, "Textbox"),
                            (70, "Paper"),
                        ],
                        default=None,
                        null=True,
                    ),
                ),
                (
                    "fill_color",
                    models.CharField(
                        blank=True, default=None, max_length=32, null=True
                    ),
                ),
                (
                    "stroke_color",
                    models.CharField(
                        blank=True, default=None, max_length=32, null=True
                    ),
                ),
                ("size", models.FloatField(blank=True, default=None, null=True)),
                ("is_ruler_line", models.BooleanField(default=False)),
                (
                    "points",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.JSONField(),
                        blank=True,
                        default=list,
                        size=None,
                    ),
                ),
                ("options", models.JSONField(blank=True, default=None, null=True)),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="elements",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "page",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="elements",
                        to="fiary.page",
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="bookshelf",
            name="room",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="bookshelves",
                to="fiary.room",
            ),
        ),
    ]
