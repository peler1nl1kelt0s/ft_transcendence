from django.urls import path
from .views import UserListView, UserDetailView, AddFriendView, RemoveFriendView, FriendListView, \
    ReceivedRequestListView, SentRequestListView, UserByUsernameView, UpdatePhotoView, BlockUserView, UnblockUserView, \
    GetBlockedUsersView, UpdateFriendUsername

urlpatterns = [
    path('api/users/update/', UpdateFriendUsername.as_view(), name='update-friend-username'),
    path('api/users/', UserListView.as_view(), name='user-list'),
    path('api/users/me/', UserDetailView.as_view(), name='user-detail'),
    path('api/users/<str:username>/', UserByUsernameView.as_view(), name='user-by-username'),
    path('api/add-friend/<str:username>', AddFriendView.as_view(), name='add-friend'),
    path('api/remove-friend/<str:username>', RemoveFriendView.as_view(), name='remove-friend'),
    path('api/received-requests/', ReceivedRequestListView.as_view(), name='received-request-list'),
    path('api/sent-requests/', SentRequestListView.as_view(), name='sent-request-list'),
    path('api/friends/', FriendListView.as_view(), name='friend-list'),
    path('api/upload-photo/', UpdatePhotoView.as_view(), name='upload-photo'),
    path('api/block-user/', BlockUserView.as_view(), name='block-user'),
    path('api/unblock-user/', UnblockUserView.as_view(), name='unblock-user'),
    path('api/get-blocked-users/', GetBlockedUsersView.as_view(), name='get-blocked-users'),
]