import json
from channels.generic.websocket import AsyncWebsocketConsumer

from users.models import Friendship, User
from .models import Message
from asgiref.sync import sync_to_async
import aioredis

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"chat_{self.room_name}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        prevMessages = await self.previous_messages(self.room_name)
        for message in prevMessages:
            await self.send(text_data=json.dumps({
                'message': message['message'],
                'username': message['user']
            }))

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        user = data['username']

        await self.saveMessage(user, message, self.room_name)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': user
            }
        )

    async def chat_message(self, event):
        message = event['message']
        username = event['username']

        await self.send(text_data=json.dumps({
            'message': message,
            'username': username
        }))

    @sync_to_async
    def saveMessage(self, user, message, room_name):
        Message.objects.create(user=user, message=message, room=room_name)

    @sync_to_async
    def previous_messages(self, room_name):
        # Sadece bu oda ile ilgili mesajları döndür
        messages = list(Message.objects.filter(room=room_name).values())
        return messages


class OnlineStatusConsumer(AsyncWebsocketConsumer):
    connected_users = set()  # Bağlanan kullanıcıların seti

    async def connect(self):
        # Kullanıcı adı parametresini URL'den al
        self.username = self.scope['url_route']['kwargs']['username']
        self.connected_users.add(self.username)

        # Bağlantıyı kabul et
        await self.accept()

        # Kullanıcıya hoş geldiniz mesajı gönder (JSON formatında)
        await self.send(text_data=json.dumps({
            "type": "welcome",
            "message": f"Welcome, {self.username}!",
            "connected_users": list(self.connected_users)
        }))

    async def disconnect(self, close_code):
        # Bağlantı kesildiğinde kullanıcıyı listeden çıkar
        self.connected_users.discard(self.username)

        # Bağlantı kesildiğini tüm bağlı istemcilere yayınlayabilirsiniz
        await self.channel_layer.group_send(
            "online_status",
            {
                "type": "status_update",
                "message": f"{self.username} disconnected.",
                "connected_users": list(self.connected_users),
            }
        )

    async def receive(self, text_data):
        # Gelen mesajları işleyip, geri JSON formatında cevap gönderin
        data = json.loads(text_data)
        await self.send(text_data=json.dumps({
            "type": "response",
            "message": f"Received: {data.get('message', '')}"
        }))

    @classmethod
    def get_connected_users(cls):
        # Bağlı kullanıcıların listesini döndür
        return list(cls.connected_users)