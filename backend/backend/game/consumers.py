import json
import asyncio
import time

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from users.models import User
from .models import Match
from .views import GamePlay

games = {}


class GameConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        global game_room
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.username = self.scope['url_route']['kwargs']['username']
        self.room_group_name = 'game_%s' % self.room_name

        
        try:
            self.user = await database_sync_to_async(User.objects.get)(username=self.username)
            self.match = await database_sync_to_async(Match.objects.get)(room_id=self.room_name)
        except User.DoesNotExist or Match.DoesNotExist:
            self.user = None
            print("User or Match not found")
            return

        if self.room_name not in games:
            games[self.room_name] = {
                "game_id": self.room_name,
                "player": {"channel": None, "username": None, "data": None},
                "enemy": {"channel": None, "username": None, "data": None},
                "database": {
                    "room_id": self.room_name,
                    "host": None,
                    "guest": None,
                    "winner": None,
                    "host_score": 0,
                    "guest_score": 0,
                    "status": "Pending",
                    "played_time": 0,
                },
                "game": None,
                "loop": None,
                "counter": 0,
            }

        game_room = games[self.room_name]

        game_room["counter"] += 1
        print(f"Room {self.room_name} has {game_room["counter"]} players")

        if (
            game_room["player"] is not None and game_room["player"]["username"] == self.username
        ) or (
            game_room["enemy"] is not None and game_room["enemy"]["username"] == self.username
        ):
            print("Player is already connected")

            await self.close()
            return

        if game_room["counter"] <= 2:
            if game_room["database"]["host"] is None or game_room["player"]["username"] == self.username:
                print("player is connected")
                game_room["player"].update({"channel": self.channel_name, "username": self.username, "data": self.user})
                game_room["database"].update({"host": self.username})
            else:
                print("enemy is connected")
                game_room["enemy"].update({"channel": self.channel_name, "username": self.username, "data": self.user})
                game_room["database"].update({"guest": self.username})
        if game_room["counter"] == 2:
            if game_room["game"] is None:
                game_room.update({"game": GamePlay()})

        await self.accept()
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'send_message',
                'mode': 'player_connected',
                'message': {
                    "player": game_room["player"]["username"],
                    "enemy": game_room["enemy"]["username"]
                }
            }
        )
        print(game_room)

    async def disconnect(self, code):
        print("disconnect")
        game_room = games[self.room_name]

        game_room["counter"] -= 1
        print(f"Room {self.room_name} has {game_room['counter']} players")
        if game_room["database"]["status"] == "playing" and game_room["counter"] == 1:
            await self.end_game(self.username)
        if game_room["database"]["status"] == "Pending" and game_room["counter"] < 2:
            print("status", game_room["database"]["status"])
            print("Pending girdim")
            print("username", game_room["player"]["username"])
            print("host", game_room["database"]["host"])
            if game_room["counter"] < 1 or (game_room["database"]["host"] == self.username):
                print("Room is empty")
                if hasattr(self, "game_loop_task"):
                    self.game_loop_task.cancel()
                if game_room["counter"] == 0:
                    print("Room is deleted")
                    del games[self.room_name]
                if game_room["database"]["host"] == self.username:
                    await self.channel_layer.group_send(
                        self.room_name,
                        {
                            'type': 'send_message',
                            'mode': 'host_disconnected',
                            'message': ""
                        }
                    )
                    print("maçi siliyorum gardaşş") 
                    self.match.status = "Empty"
                    await database_sync_to_async(self.match.save)()
            else:
                print("asdasd disconnected")
                if game_room["player"]["username"] == self.username:
                    game_room["player"].update({"channel": None, "username": None, "data": None})
                    game_room["database"].update({"host": None})
                else:
                    game_room["enemy"].update({"channel": None, "username": None, "data": None})
                    game_room["database"].update({"guest": None})
            await self.channel_layer.group_discard(self.room_name, self.channel_name)
        
        print(game_room)
            
    async def receive(self, text_data):
        game_room = games[self.room_name]
        try:
            data = json.loads(text_data)
            message = data["message"]

            match data['mode']:
                case "move":
                    if self.channel_name == game_room["player"]["channel"]:
                        if message == "w" or message == "ArrowUp":
                            game_room["game"].leftPlayerMoveUp()
                        elif message == "s" or message == "ArrowDown":
                            game_room["game"].leftPlayerMoveDown()
                    elif self.channel_name == game_room["enemy"]["channel"]:
                        if message == "w" or message == "ArrowUp":
                            game_room["game"].rightPlayerMoveUp()
                        elif message == "s" or message == "ArrowDown":
                            game_room["game"].rightPlayerMoveDown()
                case "start-button":
                    print("mesaj", message)
                    if game_room["database"]["host"] != message:
                        await self.send(text_data=json.dumps({
                            'mode': 'waiting',
                            'message': 'You is not room admin!'
                        })),                       
                        return
                    print("start button")
                    print(game_room["counter"])
                    if game_room["counter"] == 2:
                        print(game_room["game"].gameOver)
                        if not game_room["game"].gameOver:
                            for i in range(3, 0, -1):
                                await self.channel_layer.group_send(
                                    self.room_name,
                                    {
                                        'type': 'send_message',
                                        'mode': 'start-button',
                                        'message': i
                                    }
                                )
                                await self.send(text_data=json.dumps({
                                    'mode': 'start-button',
                                    'message': i
                                }))
                                await asyncio.sleep(1)

                            await self.channel_layer.group_send(
                                self.room_name,
                                {
                                    'type': 'send_message',
                                    'mode': 'game_start',
                                    'message': ""
                                }
                            )
                            if game_room["loop"] is None:
                                print("asdasdasd")
                                game_room["database"].update({"status": "playing"})
                                game_room.update(
                                    {"loop": asyncio.create_task(GameConsumer.game_loop(self))})
                                print(game_room["loop"])
                    else:
                        print("Waiting for enemy")
                        await self.send(text_data=json.dumps({
                            'mode': 'waiting',
                            'message': 'Waiting for other player to join'
                        })),
                case "surrender":
                    print("surrender")
                    surrenderPlayer = game_room["player"]["data"] if game_room["player"]["username"] == message else game_room["enemy"]["data"]

                    game_room["database"].update({
                        "status": "ended",
                        "winner": game_room["player"]["username"] if game_room["player"]["username"] != message else game_room["enemy"]["username"],
                        "host_score": 5 if game_room["player"]["username"] != message else 0,
                        "guest_score": 5 if game_room["enemy"]["username"] != message else 0,
                    })
                    game_room["game"].gameOver = True
                    await self.add_database()
                    await self.channel_layer.group_send(
                        self.room_name,
                        {
                            'type': 'send_message',
                            'mode': 'end_game',
                            'message': {
                                "leftPlayer": game_room["game"].leftPlayer,
                                "leftPlayerData": game_room["database"]["host"],
                                "rightPlayer": game_room["game"].rightPlayer,
                                "rightPlayerData": game_room["database"]["guest"],
                                "BallX": game_room["game"].BallX,
                                "BallY": game_room["game"].BallY,
                                "leftPlayerScore": game_room["game"].leftPlayerScore,
                                "rightPlayerScore": game_room["game"].rightPlayerScore,
                                "gameOver": game_room["game"].gameOver
                            }
                        }
                    )
                    if hasattr(self, "game_loop_task"):
                        self.game_loop_task.cancel()
        except Exception as e:
            print("Receive Error:", e)
            return


    async def send_message(self, event):
        message = event['message']
        mode = event['mode']
        await self.send(text_data=json.dumps({
            'mode': mode,
            'message': message
        }))

    async def end_game(self, player=None):
        game_room = games[self.room_name]
        print("end game")
        if hasattr(self, "game_loop_task"):
            self.game_loop_task.cancel()

        print("Çıkan Kullanıcı", player)

        game_room["database"].update({
            "status": "ended",
            "host_score": game_room["game"].leftPlayerScore,
            "guest_score": game_room["game"].rightPlayerScore,
        })
        if player is None:
            game_room["database"].update({
                "winner": game_room["database"]["host"] if game_room["game"].leftPlayerScore >
                                                            game_room["game"].rightPlayerScore else game_room["database"]["guest"],
            })
        else:
            game_room["database"].update({
                "winner": game_room["database"]["host"] if game_room["database"]["host"] != player else game_room["database"]["guest"],
                "host_score": 5 if game_room["database"]["host"] != player else 0,
                "guest_score": 5 if game_room["database"]["guest"] != player else 0,
            })

        winnerPlayer = await database_sync_to_async(User.objects.get)(username=game_room["database"]["winner"])
        print("winnerPlayer", winnerPlayer)
        print("Winner Score", winnerPlayer.score)
        winnerPlayer.score += 1
        await database_sync_to_async(winnerPlayer.save)()
        game_room["database"].update({"played_time": time.time() - game_room["game"].started_time})
        game_room["game"].gameOver = True
        print("datayı gönderdi")
        await self.add_database()
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'send_message',
                'mode': 'end_game',
                'message': {
                    "leftPlayer": game_room["game"].leftPlayer,
                    "leftPlayerData": game_room["database"]["host"],
                    "rightPlayer": game_room["game"].rightPlayer,
                    "rightPlayerData": game_room["database"]["guest"],
                    "BallX": game_room["game"].BallX,
                    "BallY": game_room["game"].BallY,
                    "leftPlayerScore": game_room["game"].leftPlayerScore,
                    "rightPlayerScore": game_room["game"].rightPlayerScore,
                    "gameOver": game_room["game"].gameOver
                }
            }
        )

    async def add_database(self):
        game_room = games[self.room_name]
        print("add_database")
        print(game_room)

        winnerPlayer = await database_sync_to_async(User.objects.get)(username=game_room["database"]["winner"])
        self.match.host = game_room["player"]["data"]
        self.match.guest = game_room["enemy"]["data"]
        self.match.winner = winnerPlayer
        self.match.host_score = game_room["database"]["host_score"]
        self.match.guest_score = game_room["database"]["guest_score"]
        self.match.status = game_room["database"]["status"]
        self.match.played_time = game_room["database"]["played_time"]
        await database_sync_to_async(self.match.save)()

    async def game_loop(self):
        print("Game loopasd")
        print("buradayım")
        print("status:", games[self.room_name]["database"]["status"])
        game_room = games[self.room_name]
        gameData = game_room["game"]
        print("gameData:", gameData)
        for i in range(3, 0, -1):
            await asyncio.sleep(1)
        gameData.started_time = time.time()
        print("status", game_room["database"]["status"])
        while game_room["database"]["status"] == "playing":
            print("gameData", gameData)
            gameData.BallX += gameData.ballSpeedX
            gameData.BallY += gameData.ballSpeedY

            if gameData.BallY + gameData.ballRadius > gameData.canvasHeight or gameData.BallY - gameData.ballRadius < 0:
                gameData.ballSpeedY = - gameData.ballSpeedY
            gameData.checkCollision(gameData.leftPlayer, True)
            gameData.checkCollision(gameData.rightPlayer, False)

            if gameData.BallX - gameData.ballRadius < 0:
                gameData.rightPlayerScore += 1
                gameData.resetBall()

            elif gameData.BallX + gameData.ballRadius > gameData.canvasWidth:
                gameData.leftPlayerScore += 1
                gameData.resetBall()

            if gameData.leftPlayerScore == gameData.maxScore or gameData.rightPlayerScore == gameData.maxScore:
                await self.end_game()
            await self.channel_layer.group_send(
                self.room_name,
                {
                    'type': 'send_message',
                    'mode': 'game',
                    'message': {
                        "leftPlayer": game_room["game"].leftPlayer,
                        "leftPlayerData": game_room["player"]["username"],
                        "rightPlayer": game_room["game"].rightPlayer,
                        "rightPlayerData": game_room["enemy"]["username"],
                        "BallX": gameData.BallX,
                        "BallY": gameData.BallY,
                        "BallRadius": gameData.ballRadius,
                        "paddleWidth": gameData.paddleWidth,
                        "paddleHeight": gameData.paddleHeight,
                        "leftPlayerScore": gameData.leftPlayerScore,
                        "rightPlayerScore": gameData.rightPlayerScore,
                        "gameOver": gameData.gameOver
                    }
                }
            )
            await asyncio.sleep(0.03)

