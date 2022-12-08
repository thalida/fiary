from django.db import models
from django.utils.translation import gettext_lazy as _


class Tools(models.IntegerChoices):
    ERASER = 10,
    CLEAR_ALL = 12,
    PEN = 20,
    MARKER = 21,
    HIGHLIGHTER = 22,
    BLOB = 30,
    CIRCLE = 40,
    RECTANGLE = 41,
    TRIANGLE = 42,
    LINE = 43,
    CUT = 50,
    PASTE = 51,
    IMAGE = 60,
    CHECKBOX = 70,
    TEXTBOX = 81,


class PatternTypes(models.IntegerChoices):
    SOLID = 1, _('Solid'),
    DOTS = 2, _('Dots'),
    SQUARES = 3, _('Squares'),
    LINES = 4, _('Lines'),
    ISOMETRIC = 5, _('Isometric'),

class PaletteTypes(models.IntegerChoices):
    GENERAL = 1, _('General'),
    PAPER = 10, _('Paper'),
    PATTERN = 20, _('Pattern'),
    TOOL_FILL = 31, _('Tool - Fill'),
    TOOL_STROKE = 32, _('Tool - Stroke'),

class SwatchDefaultUsages(models.IntegerChoices):
    PAPER = 1, _('Paper'),
    PATTERN = 10, _('Pattern'),
    TOOL = 20, _('Tool'),
