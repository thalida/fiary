from django.urls import path, re_path
from . import views

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

urlpatterns = [
    path('token/', views.MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.RegisterView.as_view(), name='auth_register'),
    re_path(
        r'^register-by-token/(?P<backend>[^/]+)/$',
        views.register_by_access_token,
        name='register_by_access_token'
    ),
    path('', views.getRoutes)
]
