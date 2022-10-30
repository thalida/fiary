from django.urls import re_path
from . import views

urlpatterns = [
    re_path(
        r'^register-by-token/(?P<backend>[^/]+)/$',
        views.register_by_access_token,
        name='users_register_by_access_token'
    ),
]
