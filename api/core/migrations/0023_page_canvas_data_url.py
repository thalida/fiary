# Generated by Django 4.1.4 on 2022-12-20 22:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0022_page_canvas_data_url_alter_element_tool"),
    ]

    operations = [
        migrations.AddField(
            model_name="page",
            name="canvas_data_url",
            field=models.TextField(blank=True, default=None, null=True),
        ),
    ]
