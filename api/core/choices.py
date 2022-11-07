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


class SwatchTypes(models.IntegerChoices):
    SOLID_COLOR = 1,
    LINEAR_GRADIENT_COLOR = 10,
