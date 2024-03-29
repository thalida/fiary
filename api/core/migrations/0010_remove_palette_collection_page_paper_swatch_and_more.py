# Generated by Django 4.1.2 on 2022-11-07 22:35

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0009_alter_page_pattern_opacity"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="palette",
            name="collection",
        ),
        migrations.AddField(
            model_name="page",
            name="paper_swatch",
            field=models.ForeignKey(
                blank=True,
                default=None,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="paper_swatch",
                to="core.paletteswatch",
            ),
        ),
        migrations.AddField(
            model_name="page",
            name="pattern_swatch",
            field=models.ForeignKey(
                blank=True,
                default=None,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="pattern_swatch",
                to="core.paletteswatch",
            ),
        ),
        migrations.AddField(
            model_name="palette",
            name="collections",
            field=models.ManyToManyField(
                blank=True, related_name="palettes", to="core.palettecollection"
            ),
        ),
        migrations.AddField(
            model_name="palette",
            name="is_public",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="palette",
            name="palette_type",
            field=models.IntegerField(
                choices=[(1, "Paper"), (10, "Pattern"), (20, "General")], default=20
            ),
        ),
    ]
