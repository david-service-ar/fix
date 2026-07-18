from django.contrib import admin
from django.urls import path
from core_api.views import health_check, chat_endpoint, history_endpoint

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', health_check, name='health_check'),
    path('chat', chat_endpoint, name='chat_endpoint'),
    path('history', history_endpoint, name='history_endpoint'),
]
