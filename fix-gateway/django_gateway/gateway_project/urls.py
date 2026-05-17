from django.contrib import admin
from django.urls import path
from gateway_api.views import health_check, proxy_chat, proxy_history

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', health_check, name='health_check'),
    path('api/chat', proxy_chat, name='proxy_chat'),
    path('api/history', proxy_history, name='proxy_history'),
]
