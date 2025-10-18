from django.urls import path
from .views import MatchListViews, MatchIdDetailView, MatchRoomCreate, FindMatchForUser, LeaderBoardView

urlpatterns = [
    path('api/match/', MatchListViews.as_view(), name='match-list'),
    path('api/match/<int:id>/', MatchIdDetailView.as_view(), name='match-detail'),
    path('api/match/create/', MatchRoomCreate.as_view(), name='create-match'),
    path('api/match/find/<str:users>', FindMatchForUser.as_view(), name="find-match"),
    path('api/leaderboard/', LeaderBoardView.as_view(), name='leaderboard')
]