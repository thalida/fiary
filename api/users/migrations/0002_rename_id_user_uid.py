# Generated by Django 4.1.2 on 2022-11-12 16:29

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(
            model_name="user",
            old_name="id",
            new_name="uid",
        ),
    ]