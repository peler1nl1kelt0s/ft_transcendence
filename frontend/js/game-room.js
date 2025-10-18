auth_token = localStorage.getItem("token");
let gameSocket = null;

async function createRoom(roomID) {
    try {
        const response = await fetch(`https://10.11.4.10/api/match/create/`, {
            method: "POST",
            credentials: "include",
            headers: {
                Authorization: `Token ${auth_token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ room_id: roomID }),
        });
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("There has been a problem with your fetch operation:", error);
    }
}
function createSixDigitRandomNumber() {
    return Math.floor(100000 + Math.random() * 900000);
}

async function createGame(roomID) {
    await createRoom(roomID);
}

async function initialize(roomID) {
        gameSocket = new WebSocket(
            "wss://" + "10.11.4.10" + "/ws/game/" + roomID + "/" + user_profile.username + "/"
        );
        gameSocket.onclose = function (e) {
            window.history.back();
        };
        gameSocket.onmessage = async function (e) {
            let gameData = null;
            const data = JSON.parse(e.data);
            const contentElement = document.getElementById("content");
            if (data["mode"] === "game_start") {
                await fetch("/pages/play-with-friends.html", { cache: "no-cache" })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error("Network response was not ok");
                        }
                        return response.text();
                    })
                    .then((html) => {
                        contentElement.classList.remove("fade-in");
                        contentElement.style.opacity = 0;
                        setTimeout(() => {
                            contentElement.innerHTML = html;
                            document.title = "Game Room: " + roomID;
                            contentElement.classList.add("fade-in");
                            contentElement.style.opacity = 1;
                        }, 100);
                    })
                    .catch((error) =>
                        console.error(
                            "There has been a problem with your fetch operation:",
                            error
                        )
                    );
                    document.addEventListener("keydown", function (event) {
                        if (gameSocket && window.location.pathname.startsWith("/game-")) {
                            if (event.key === "w" || event.key === "W") {
                                gameSocket.send(JSON.stringify({ mode: "move", message: "w" }));
                            } 
                            else if (event.key === "s" || event.key === "S") {
                                gameSocket.send(JSON.stringify({ mode: "move", message: "s" }));
                            } 
                            else if (event.key === "ArrowUp") {
                                gameSocket.send(JSON.stringify({ mode: "move", message: "ArrowUp" }));
                            } 
                            else if (event.key === "ArrowDown") {
                                gameSocket.send(JSON.stringify({ mode: "move", message: "ArrowDown" }));
                            }
                        }
                    });
            }
            else if (data["mode"] == "start-button") {
                let startButton = document.getElementById("start-button");
                startButton.innerHTML = data["message"];
            }
            else if (data["mode"] === "player_connected") {
                let enemyData = null, enemyProfilePicture = null, enemyUsername = "Enemy is not found";
                let playerData = null, playerProfilePicture = null, playerUsername = "Player is not found";
                enemy = data["message"].enemy;
                player = data["message"].player;
                let container = contentElement.children[0]
                if (player) {
                    playerData = await findUserAndGetData(player, auth_token);
                    playerProfilePicture = getProfilePicture(playerData);
                    playerUsername = playerData.username;
                }
                if (enemy) {
                    enemyData = await findUserAndGetData(enemy, auth_token);
                    enemyProfilePicture = getProfilePicture(enemyData);
                    enemyUsername = enemyData.username;
                }

                let playerCont = document.getElementById("player");
                let enemyCont = document.getElementById("enemy");
                playerCont.innerHTML = `
                        <img src=${playerProfilePicture} class="profile-pic" alt="Profile Picture">
                        <div class="content" id="content">
                            <div class="username" id="player1-username">${playerUsername}</div>
                        </div>
                `
                enemyCont.innerHTML = `
                        <img src=${enemyProfilePicture} class="profile-pic" alt="Profile Picture">
                        <div class="content" id="content">
                            <div class="username" id="player2-username">${enemyUsername}</div>
                        </div>
                `

            }
            else if (data["mode"] === "game") {
                gameData = data["message"];
                let canvas = document.getElementById("canvas");
                let ctx = canvas.getContext("2d");

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = "#FFF";
                ctx.font = "15px Arial";

                // Draw middle line
                ctx.beginPath();
                ctx.moveTo(canvas.width / 2, 0);
                ctx.lineTo(canvas.width / 2, canvas.height);
                ctx.strokeStyle = "#FFF";
                ctx.stroke();
                ctx.closePath();

                // Draw ball
                ctx.beginPath();
                ctx.arc(gameData.BallX, gameData.BallY, gameData.BallRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();

                // Draw left paddle
                ctx.fillRect(0, gameData.leftPlayer, gameData.paddleWidth, gameData.paddleHeight);

                // Draw right paddle
                ctx.fillRect(canvas.width - gameData.paddleWidth, gameData.rightPlayer, gameData.paddleWidth, gameData.paddleHeight);

                // Draw scores
                ctx.fillText("Score: " + gameData.leftPlayerScore, 10, 20);
                ctx.fillText("Score: " + gameData.rightPlayerScore, canvas.width - 70, 20);
            }
            else if (data["mode"] === "end_game") {
                gameData = data["message"];
                if (gameData.gameOver === true) {
                    alert("Game Over");
                    if (gameSocket) {
                        gameSocket.close();
                    }
                }
            }
            else if (data["mode"] === "already_player") {
                if (data["message"] === user_profile.username) {
                    window.location.href = "/home";
                    alert("You is already connected!")
                }
            }
            else if (data["mode"] === "waiting") {
                alert(data["message"]);
            }
            else if (data["mode"] === "host_disconnected")
                if (gameSocket)
                    gameSocket.close();
        }
        return roomID;
}

function surrenderButtonClicked() {
    if (gameSocket) {
        gameSocket.send(JSON.stringify({ mode: "surrender", message: user_profile.username }));
    }
}

function startButtonClicked() {
    let startButton = document.getElementById("start-button");
    
    if (gameSocket) {
        gameSocket.send(JSON.stringify({ mode: "start-button", message: user_profile.username }));
        startButton.disabled = true;
    }

}

