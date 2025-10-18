import math

from rest_framework import generics, status
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import JsonResponse

import json
from .models import Match
from .serializers import MatchSerializer
from users.serializers import CustomUserSerializer
from users.models import User


class MatchListViews(generics.ListCreateAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    authentication_classes = [TokenAuthentication]

class MatchIdDetailView(generics.RetrieveAPIView):
    authentication_classes = [TokenAuthentication]

    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    lookup_field = 'id'

class  FindMatchForUser(generics.ListCreateAPIView):
    authentication_classes = [TokenAuthentication]
    serializer_class = MatchSerializer

    def get_queryset(self):
        try:
            user = User.objects.get(username=self.kwargs['users'])
        except User.DoesNotExist:
            return Match.objects.none()
        matches = Match.objects.filter(
            host=user
        ) | Match.objects.filter(
            guest__username=user.username
        )

        print(matches)
        return matches.distinct()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        if not queryset.exists():
            JsonResponse({"error": "No matches found."}, status=status.HTTP_404_NOT_FOUND)
        return super().list(request, *args, **kwargs)
    
from django.db.models import Q
from collections import defaultdict

class LeaderBoardView(APIView):
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        try:
            print("Leaderboard")
            users = User.objects.all()
            print(users)
            leaderboard = {}
            for user in users:
                matches = Match.objects.filter(
                    Q(host=user) | Q(guest=user)
                )
                print(matches)

                win_count = matches.filter(winner=user).count()
                loss_count = matches.filter(~Q(winner=user) & ~Q(winner=None)).count()
                draw_count = matches.filter(winner=None).count()
                total_count = matches.count()

                print(win_count, loss_count, draw_count)

                total_matches = win_count + loss_count + draw_count
                winrate = (win_count / total_matches) * 100 if total_matches > 0 else 0

                longest_streak = 0
                current_streak = 0
                print("asdada")
                for match in matches: 
                    if match.winner == user:
                        current_streak += 1
                        longest_streak = max(longest_streak, current_streak)
                    else:
                        current_streak = 0
    
                profile_picture = user.username
                print("test")

                print("burada", user.username, win_count, loss_count, draw_count, winrate, longest_streak)
                leaderboard[user.username] = {
                    "win": win_count,
                    "loss": loss_count,
                    "draw": draw_count,
                    "total": total_count,
                    "picture": profile_picture,
                    "winrate": winrate,
                    "longestStreak": longest_streak,
                } 
            print(leaderboard)
            return Response({"data": leaderboard}, status=status.HTTP_200_OK)
        except Match.DoesNotExist:
            return Response({"error": "Match data not found."}, status=status.HTTP_404_NOT_FOUND)


class MatchRoomCreate(APIView):
    authentication_classes = [TokenAuthentication]
    serializer_class = MatchSerializer

    def post(self, request):
        try:
            if Match.objects.filter(room_id=request.data['room_id']).exists():
                serializer = MatchSerializer(Match.objects.get(room_id=request.data['room_id']))
                return Response({"data": serializer.data}, status=status.HTTP_201_CREATED)
            match = Match.objects.create(
                room_id=request.data['room_id'],
                host_score=0,
                guest_score=0,
            )
            serializer = MatchSerializer(match)

            return Response({"data": serializer.data}, status=status.HTTP_201_CREATED)
        except Match.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_201_CREATED)


class GamePlay:
    def __init__(self):
        self.initialBallSpeedX = 6
        self.initialBallSpeedY = 6
        self.ballSpeedY = self.initialBallSpeedY
        self.ballSpeedX = self.initialBallSpeedX
        self.ballRadius = 10
        self.lastCollision = False
        self.canvasWidth = 600
        self.canvasHeight = 400
        self.paddleWidth = 10
        self.paddleHeight = 80
        self.paddleSpeed = 15
        self.leftPlayer = self.canvasHeight / 2 - self.paddleHeight / 2
        self.rightPlayer = self.canvasHeight / 2 - self.paddleHeight / 2
        self.leftPlayerScore = 0
        self.rightPlayerScore = 0
        self.maxScore = 5
        self.BallX = self.canvasWidth / 2
        self.BallY = self.canvasHeight / 2
        self.gameOver = False
        self.started_time = 0

    def leftPlayerMoveUp(self):
        self.leftPlayer -= self.paddleSpeed
        if self.leftPlayer < 0:
            self.leftPlayer = 0

    def leftPlayerMoveDown(self):
        self.leftPlayer += self.paddleSpeed
        if self.leftPlayer + self.paddleHeight > self.canvasHeight:
            self.leftPlayer = self.canvasHeight - self.paddleHeight

    def rightPlayerMoveUp(self):
        self.rightPlayer -= self.paddleSpeed
        if self.rightPlayer < 0:
            self.rightPlayer = 0

    def rightPlayerMoveDown(self):
        self.rightPlayer += self.paddleSpeed
        if self.rightPlayer + self.paddleHeight > self.canvasHeight:
            self.rightPlayer = self.canvasHeight - self.paddleHeight


    def checkCollision(self, paddleC, isLeftPlayer):
        paddlePosX = self.paddleWidth if isLeftPlayer else self.canvasWidth - self.paddleWidth
        if abs(self.BallX - paddlePosX) < self.ballRadius + self.paddleWidth / 2:
            withinPaddle = self.BallY > paddleC and self.BallY < paddleC + self.paddleHeight
            if withinPaddle and not self.lastCollision:

                collisionPoint = self.BallY - (paddleC + self.paddleHeight / 2)
                normalizedPoint = collisionPoint / (self.paddleHeight / 2)
                bounceAngle = normalizedPoint * (math.pi / 4)

                if abs(normalizedPoint) > 1:
                    normalizedPoint = 1 if normalizedPoint > 0 else -1
                    bounceAngle = normalizedPoint * (math.pi / 4)

                self.ballSpeedX = -self.ballSpeedX * 1.1
                self.ballSpeedY = self.ballSpeedX * math.tan(bounceAngle)
                self.lastCollision = True
            else:
                self.lastCollision = False
        else:
            self.lastCollision = False


    def resetBall(self):
        self.BallX = self.canvasWidth / 2
        self.BallY = self.canvasHeight / 2
        #self.ballSpeedX = -self.ballSpeedX
        self.ballSpeedX = self.initialBallSpeedX
        self.ballSpeedY = self.initialBallSpeedY