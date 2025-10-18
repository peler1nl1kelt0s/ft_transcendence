from rest_framework import generics, status
from .models import User
from rest_framework.authentication import TokenAuthentication
from .serializers import CustomUserSerializer, FriendUserSerializer, PhotoUpdateSerializer
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Friendship, Block
from django.shortcuts import get_object_or_404

import base64, os

class UserListView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = CustomUserSerializer

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CustomUserSerializer

    def get_object(self):
        return self.request.user

class UserByUsernameView(generics.RetrieveAPIView):
    authentication_classes = [TokenAuthentication]
    
    queryset = User.objects.all()
    serializer_class = CustomUserSerializer
    lookup_field = 'username'

class UpdateFriendUsername(APIView):
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        new_username = request.data.get("new_username")
        if not new_username:
            return Response({"error": "new_username is required"}, status=400)

        user = request.user
        user.username = new_username
        user.save()

        return Response({"message": "Username updated successfully"}, status=200)

class AddFriendView(APIView):
    authentication_classes = [TokenAuthentication]

    def post(self, request, *args, **kwargs):
        username = kwargs.get('username')
        try:
            to_user = User.objects.get(username=username)
            if request.user == to_user:
                return Response({"error": "The user cannot be friends with himself."}, status=status.HTTP_201_CREATED)
            if Friendship.objects.filter(from_user=request.user, to_user=to_user).exists():
                return Response({"error": "You are already friends."}, status=status.HTTP_201_CREATED)
            Friendship.objects.create(from_user=request.user, to_user=to_user)
            if Friendship.objects.filter(from_user=to_user, to_user=request.user).exists():
                return Response({"message": "Friend Added!"}, status=status.HTTP_201_CREATED)
            return Response({"message": "Friendship request sent."}, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_201_CREATED)

class UpdatePhotoView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = PhotoUpdateSerializer(data=request.data)
        if serializer.is_valid():
            # Base64 verisini çözüp dosyaya dönüştür
            user = request.user
            photo_file = serializer.create_image_file()

            user.profile_picture = photo_file
            user.save()

            with open(user.profile_picture.path, "rb") as f:
                base64_photo = base64.b64encode(f.read()).decode("utf-8")

            return Response({"message": "Fotoğraf başarıyla yüklendi.", "base64_photo": base64_photo}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RemoveFriendView(APIView):
    authentication_classes = [TokenAuthentication]

    def post(self, request, *args, **kwargs):
        username = kwargs.get('username')
        try:
            to_user = User.objects.get(username=username)
            from_friendship = Friendship.objects.filter(from_user=request.user, to_user=to_user)
            to_friendship = Friendship.objects.filter(from_user=to_user, to_user=request.user)
            if from_friendship.exists() and to_friendship.exists():
                to_friendship.delete()
                from_friendship.delete()
                return Response({"message": f"{to_user.username} removed."}, status=status.HTTP_200_OK)
            elif to_friendship.exists():
                to_friendship.delete()
                return Response({"message": f"{to_user.username} request rejected."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Friendship not found."}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)


class FriendListView(generics.ListAPIView):
    authentication_classes = [TokenAuthentication]

    serializer_class = FriendUserSerializer

    def get_queryset(self):
        user = self.request.user

        received_users = user.received_friendships.values_list('from_user_id', flat=True)
        sent_users = user.sent_friendships.values_list('to_user_id', flat=True)
        common_user_ids = set(received_users).intersection(set(sent_users))

        return User.objects.filter(id__in=common_user_ids)


class ReceivedRequestListView(generics.ListAPIView):
    authentication_classes = [TokenAuthentication]

    serializer_class = FriendUserSerializer

    def get_queryset(self):
        user = self.request.user

        received_user_ids = user.received_friendships.values_list('from_user_id', flat=True)
        sent_user_ids = user.sent_friendships.values_list('to_user_id', flat=True)
        filtered_received_user_ids = set(received_user_ids) - set(sent_user_ids)

        return User.objects.filter(id__in=filtered_received_user_ids)


class SentRequestListView(generics.ListAPIView):
    authentication_classes = [TokenAuthentication]

    serializer_class = FriendUserSerializer

    def get_queryset(self):
        user = self.request.user

        received_user_ids = user.received_friendships.values_list('from_user_id', flat=True)
        sent_user_ids = user.sent_friendships.values_list('to_user_id', flat=True)
        filtered_sent_user_ids = set(sent_user_ids) - set(received_user_ids)

        return User.objects.filter(id__in=filtered_sent_user_ids)


class BlockUserView(APIView):
    authentication_classes = [TokenAuthentication]

    def post(self, request, *args, **kwargs):
        username_to_block = request.data.get("username")
        if not username_to_block:
            return Response({"error": "Username is required"}, status=400)

        user_to_block = get_object_or_404(User, username=username_to_block)

        if request.user == user_to_block:
            return Response({"error": "You cannot block yourself"}, status=400)

        request.user.block_user(user_to_block)
        return Response({"message": f"{username_to_block} has been blocked"}, status=200)

class UnblockUserView(APIView):
    authentication_classes = [TokenAuthentication]

    def post(self, request, *args, **kwargs):
        username_to_unblock = request.data.get("username")
        if not username_to_unblock:
            return Response({"error": "Username is required"}, status=400)

        user_to_unblock = get_object_or_404(User, username=username_to_unblock)

        request.user.unblock_user(user_to_unblock)
        return Response({"message": f"{username_to_unblock} has been unblocked"}, status=200)


class GetBlockedUsersView(APIView):
    authentication_classes = [TokenAuthentication]

    def get(self, request, *args, **kwargs):
        blocked_users = Block.objects.filter(from_user=request.user).select_related('to_user')

        blocked_users_data = [
            {
                "username": block.to_user.username,
            }
            for block in blocked_users
        ]

        return Response({"blocked_users": blocked_users_data}, status=200)
