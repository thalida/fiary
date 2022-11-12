# Generated by Django 4.1.2 on 2022-11-12 15:32

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0017_alter_paletteswatch_options_and_more"),
    ]

    operations = [
        migrations.RenameField(
            model_name="bookshelf",
            old_name="id",
            new_name="uid",
        ),
        migrations.RenameField(
            model_name="element",
            old_name="id",
            new_name="uid",
        ),
        migrations.RenameField(
            model_name="notebook",
            old_name="id",
            new_name="uid",
        ),
        migrations.RenameField(
            model_name="page",
            old_name="id",
            new_name="uid",
        ),
        migrations.RenameField(
            model_name="palette",
            old_name="id",
            new_name="uid",
        ),
        migrations.RenameField(
            model_name="palettecollection",
            old_name="id",
            new_name="uid",
        ),
        migrations.RenameField(
            model_name="paletteswatch",
            old_name="id",
            new_name="uid",
        ),
        migrations.RenameField(
            model_name="room",
            old_name="id",
            new_name="uid",
        ),
    ]
