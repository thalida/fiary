# Generated by Django 4.1.2 on 2022-11-17 03:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0021_rename_image_render_element_canvas_data_url"),
    ]

    operations = [
        migrations.AddField(
            model_name="page",
            name="canvas_data_url",
            field=models.TextField(blank=True, default=None, null=True),
        ),
    ]
