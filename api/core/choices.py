from django.db import models
from django.utils.translation import gettext_lazy as _


class Tools(models.IntegerChoices):
    ERASER = 1,
    CLEAR_ALL = 2,
    PEN = 10,
    MARKER = 11,
    HIGHLIGHTER = 12,
    BLOB = 20,
    CIRCLE = 30,
    RECTANGLE = 31,
    TRIANGLE = 32,
    LINE = 33,
    CUT = 40,
    PASTE = 41,
    IMAGE = 50,
    CHECKBOX = 60,
    TEXTBOX = 61,
    PAPER = 70,


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
