from django.urls import re_path
from .consumers import ChatConsumer, OnlineStatusConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<room_name>\w+)/$', ChatConsumer.as_asgi()),
    re_path(r'ws/status/(?P<username>[A-Za-z0-9_]+)/$', OnlineStatusConsumer.as_asgi()),
]
